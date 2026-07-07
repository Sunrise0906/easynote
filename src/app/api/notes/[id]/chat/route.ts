import { NextRequest } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { getNote, updateNote } from "@/lib/store";
import { streamChatReply } from "@/lib/ai/chat";
import { AiNotConfiguredError } from "@/lib/ai/client";
import { canChat, recordChatMessage } from "@/lib/quota";

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

  const history = [
    ...note.chat.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: message },
  ];

  let stream: ReturnType<typeof streamChatReply>;
  try {
    stream = streamChatReply(note, history);
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return jsonError(err.message, 503, err.code);
    }
    throw err;
  }

  await recordChatMessage(user.id);
  const userTs = Date.now();
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send({ text: event.delta.text });
          }
        }
        const final = await stream.finalMessage();
        const reply = final.content
          .filter((b) => b.type === "text")
          .map((b) => (b as { text: string }).text)
          .join("");
        await updateNote(id, (n) => {
          n.chat.push({ role: "user", content: message, ts: userTs });
          n.chat.push({ role: "assistant", content: reply, ts: Date.now() });
          if (n.chat.length > 200) n.chat = n.chat.slice(-200);
        });
        send({ done: true });
      } catch (err) {
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
