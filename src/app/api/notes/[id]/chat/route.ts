import { NextRequest } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { getNote, updateNote } from "@/lib/store";
import { streamChatReply } from "@/lib/ai/chat";
import { AiNotConfiguredError } from "@/lib/ai/client";
import { RefusalError } from "@/lib/ai/provider";
import { aiConfigured } from "@/lib/config";
import { canChat, releaseChat, reserveChat } from "@/lib/quota";

type Params = { params: Promise<{ id: string }> };

/**
 * POST { message: string }
 * Streams the assistant reply as Server-Sent Events:
 *   data: {"text": "…"}      – incremental tokens
 *   data: {"done": true}     – end of reply
 *   data: {"error": "…"}     – terminal error
 */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;
  const { id } = await params;
  const note = await getNote(id);
  if (!note || note.userId !== user.id) return jsonError("Note not found.", 404);
  if (note.transcript.length === 0) {
    return jsonError("This note has no content to chat about yet.", 409);
  }
  if (!canChat(user)) {
    return jsonError(
      "You've hit today's chat limit on the Starter plan. Upgrade to Pro for unlimited chat.",
      403,
      "quota_exceeded"
    );
  }

  const body = (await req.json().catch(() => null)) as {
    message?: string;
  } | null;
  const message = body?.message?.trim();
  if (!message) return jsonError("Empty message.");
  if (message.length > 4000) return jsonError("Message too long.");

  // Drop any historically-persisted empty messages so a prior refusal can't
  // poison the conversation (the API rejects empty-content messages with 400).
  const history = [
    ...note.chat
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: message },
  ];

  // Atomically reserve a daily chat slot; refund it if the reply fails so an
  // outage doesn't silently burn the user's quota.
  if (!(await reserveChat(user))) {
    return jsonError(
      "You've hit today's chat limit on the Starter plan. Upgrade to Pro for unlimited chat.",
      403,
      "quota_exceeded"
    );
  }

  // Provider not configured surfaces before we open the stream.
  if (!aiConfigured()) {
    await releaseChat(user.id);
    return jsonError(new AiNotConfiguredError().message, 503, "ai_not_configured");
  }

  const stream = streamChatReply(note, history, user.modelId);
  const userTs = Date.now();
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      try {
        let reply = "";
        for await (const delta of stream) {
          reply += delta;
          send({ text: delta });
        }

        // A refusal or any reply with no text must NOT be persisted as an
        // empty assistant message — that would 400 every future turn on this
        // note. Surface an error and refund the quota instead.
        if (reply.trim().length === 0) {
          await releaseChat(user.id);
          send({
            error:
              "I couldn't answer that one. Try rephrasing your question.",
          });
          return;
        }

        await updateNote(id, (n) => {
          n.chat.push({ role: "user", content: message, ts: userTs });
          n.chat.push({ role: "assistant", content: reply, ts: Date.now() });
          if (n.chat.length > 200) n.chat = n.chat.slice(-200);
        });
        send({ done: true });
      } catch (err) {
        if (err instanceof RefusalError) {
          await releaseChat(user.id);
          send({
            error: "I couldn't answer that one. Try rephrasing your question.",
          });
          return;
        }
        await releaseChat(user.id);
        send({
          error:
            err instanceof Error
              ? err.message
              : "The reply was interrupted. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/** DELETE — clear chat history for this note. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const note = await getNote(id);
  if (!note || note.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }
  await updateNote(id, (n) => {
    n.chat = [];
  });
  return Response.json({ ok: true });
}
