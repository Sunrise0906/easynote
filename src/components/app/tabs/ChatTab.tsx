"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, MessageCircleQuestion, Send } from "lucide-react";
import Markdown from "../Markdown";
import { Button } from "../../ui";
import { ApiError, apiDelete, streamChat } from "@/lib/client";
import { ChatMessage, NoteData } from "@/lib/types";

const SUGGESTIONS = [
  "Summarize the main points in 3 sentences",
  "Explain the hardest concept like I'm 12",
  "What could be on a test about this?",
  "Give a real-world example from this material",
];

export default function ChatTab({
  note,
  aiReady,
  onNoteChange,
}: {
  note: NoteData;
  aiReady: boolean;
  onNoteChange?: (n: NoteData) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(note.chat ?? []);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, partial]);

  // Persist chat into the parent note so switching tabs (which unmounts this
  // component) doesn't lose the just-sent messages.
  const commit = (next: ChatMessage[]) => {
    setMessages(next);
    onNoteChange?.({ ...note, chat: next });
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || streaming) return;
    setError("");
    setInput("");
    const withUser: ChatMessage[] = [
      ...messages,
      { role: "user", content: message, ts: Date.now() },
    ];
    setMessages(withUser);
    setStreaming(true);
    setPartial("");
    let acc = "";
    try {
      const full = await streamChat(note.id, message, (chunk) => {
        acc += chunk;
        setPartial(acc);
      });
      commit([
        ...withUser,
        { role: "assistant", content: full, ts: Date.now() },
      ]);
    } catch (e) {
      if (e instanceof ApiError && e.code === "quota_exceeded") {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "The reply failed.");
      }
      // If a partial reply had streamed, keep the user message and show what
      // arrived (marked interrupted). Otherwise roll back the user message and
      // restore it to the input so nothing is silently lost.
      if (acc.trim()) {
        commit([
          ...withUser,
          {
            role: "assistant",
            content: acc + "\n\n_(reply interrupted)_",
            ts: Date.now(),
          },
        ]);
      } else {
        setMessages(messages);
        setInput(message);
      }
    } finally {
      setStreaming(false);
      setPartial("");
    }
  };

  const clear = async () => {
    if (!confirm("Clear this note's chat history?")) return;
    try {
      await apiDelete(`/api/notes/${note.id}/chat`);
      commit([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not clear chat.");
    }
  };

  if (!aiReady) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center">
        <MessageCircleQuestion className="mx-auto text-primary" size={36} />
        <div className="mt-3 font-display font-bold text-ink">
          Chat with this note
        </div>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
          Configure an AI provider and restart to ask
          questions about this material.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[36rem] flex-col rounded-lg border border-border bg-surface">
      {/* messages */}
      <div className="thin-scroll flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && !streaming && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircleQuestion size={36} className="text-primary" />
            <div className="mt-3 font-display font-semibold text-ink">
              Ask anything about “{note.title}”
            </div>
            <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
              Answers are grounded in this note&apos;s transcript and notes.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-md border border-border px-3.5 py-2 text-left text-xs font-medium text-muted transition hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-br-md bg-primary px-4 py-2.5 text-sm leading-6 text-primary-ink">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[92%] rounded-lg rounded-bl-md bg-surface-2 px-4 py-2.5 text-sm text-ink">
                <Markdown>{m.content}</Markdown>
              </div>
            </div>
          )
        )}

        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[92%] rounded-lg rounded-bl-md bg-surface-2 px-4 py-2.5 text-sm text-ink">
              {partial ? (
                <Markdown>{partial}</Markdown>
              ) : (
                <span className="inline-flex gap-1">
                  <Dot delay="0ms" />
                  <Dot delay="150ms" />
                  <Dot delay="300ms" />
                </span>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-5 mb-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-600">
          {error}{" "}
          {error.includes("Upgrade") && (
            <a href="/price" className="font-semibold underline">
              See plans
            </a>
          )}
        </div>
      )}

      {/* input */}
      <div className="flex items-end gap-2 border-t border-border p-3.5">
        {messages.length > 0 && (
          <Button
            variant="ghost"
            onClick={clear}
            className="!px-2.5 !py-2.5"
            title="Clear chat history"
          >
            <Eraser size={16} />
          </Button>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask about this note… (Enter to send)"
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          onClick={() => send(input)}
          disabled={!input.trim() || streaming}
          className="!px-3.5 !py-2.5"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
      style={{ animationDelay: delay }}
    />
  );
}
