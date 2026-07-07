import Anthropic from "@anthropic-ai/sdk";
import { Note, transcriptFullText } from "../store";
import { truncateChars } from "../utils";
import { anthropic, MODEL } from "./client";

const CONTEXT_BUDGET = 150_000;

function chatSystemBlocks(note: Note): Anthropic.TextBlockParam[] {
  const context = [
    `NOTE TITLE: ${note.title}`,
    note.summary ? `SUMMARY: ${note.summary}` : "",
    "",
    "=== SOURCE CONTENT ===",
    truncateChars(transcriptFullText(note), CONTEXT_BUDGET),
    "",
    note.notesMarkdown
      ? `=== GENERATED NOTES ===\n${truncateChars(note.notesMarkdown, 40_000)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    {
      type: "text",
      text: `You are EasyNote's study tutor. You answer questions about ONE specific note using its source content below.

Guidelines:
- Ground every answer in the note's content; quote or reference specific parts when helpful.
- If the answer is not in the material, say so plainly, then (optionally) add clearly-labelled general knowledge.
- Be concise and clear. Use Markdown (short paragraphs, bullets) when it aids readability.
- Answer in the language the user writes in.`,
    },
    {
      type: "text",
      text: context,
      cache_control: { type: "ephemeral" },
    },
  ];
}

/**
 * Stream an assistant reply for a note-scoped chat.
 * Returns the SDK stream; the API route adapts it to SSE.
 */
export function streamChatReply(
  note: Note,
  history: { role: "user" | "assistant"; content: string }[]
) {
  const client = anthropic();
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  return client.messages.stream({
    model: MODEL(),
    max_tokens: 4000,
    system: chatSystemBlocks(note),
    messages,
  });
}

export const SUGGESTED_QUESTIONS = [
  "Summarize the main argument in 3 sentences",
  "Explain the most difficult concept simply",
  "What might be on a test about this?",
  "Give me a real-world example of this topic",
];
