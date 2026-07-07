import { Note, transcriptFullText } from "../store";
import { truncateChars } from "../utils";
import { streamReply } from "./provider";

const CONTEXT_BUDGET = 150_000;

function chatSystem(note: Note): string {
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

  return `You are EasyNote's study tutor. You answer questions about ONE specific note using its source content below.

Guidelines:
- Ground every answer in the note's content; quote or reference specific parts when helpful.
- If the answer is not in the material, say so plainly, then (optionally) add clearly-labelled general knowledge.
- Be concise and clear. Use Markdown (short paragraphs, bullets) when it aids readability.
- Answer in the language the user writes in.

${context}`;
}

/**
 * Stream an assistant reply for a note-scoped chat as text deltas.
 * Works across providers (Claude or any OpenAI-compatible backend).
 */
export function streamChatReply(
  note: Note,
  history: { role: "user" | "assistant"; content: string }[]
): AsyncGenerator<string> {
  return streamReply({
    system: chatSystem(note),
    messages: history,
    maxTokens: 4000,
  });
}

export const SUGGESTED_QUESTIONS = [
  "Summarize the main argument in 3 sentences",
  "Explain the most difficult concept simply",
  "What might be on a test about this?",
  "Give me a real-world example of this topic",
];
