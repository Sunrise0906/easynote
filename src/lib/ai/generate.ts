import { Flashcard, Note, QuizQuestion, transcriptFullText } from "../store";
import { truncateChars } from "../utils";
import { anthropic, MODEL, structuredRequest } from "./client";

/** Character budget for material fed into generation prompts. */
const MATERIAL_BUDGET = 200_000;

function noteMaterial(note: Note): string {
  const transcript = truncateChars(transcriptFullText(note), MATERIAL_BUDGET);
  const parts = [
    `SOURCE TYPE: ${note.sourceType}`,
    note.sourceUrl ? `SOURCE URL: ${note.sourceUrl}` : "",
    "",
    "=== SOURCE CONTENT (transcript / extracted text) ===",
    transcript,
  ];
  return parts.filter(Boolean).join("\n");
}

/* ------------------------------------------------------------------ */
/* Note content (title + summary + key points + structured markdown)   */
/* ------------------------------------------------------------------ */

export interface GeneratedNoteContent {
  title: string;
  emoji: string;
  language: string;
  summary: string;
  keyPoints: string[];
  notesMarkdown: string;
}

const NOTE_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Short descriptive title for the note (max ~60 chars).",
    },
    emoji: {
      type: "string",
      description: "One emoji that fits the topic.",
    },
    language: {
      type: "string",
      description:
        "BCP-47 language code of the source content, e.g. 'en', 'zh', 'es'.",
    },
    summary: {
      type: "string",
      description: "2–4 sentence overview of the content.",
    },
    keyPoints: {
      type: "array",
      items: { type: "string" },
      description: "5–8 key takeaways, one sentence each.",
    },
    notesMarkdown: {
      type: "string",
      description: "Full structured study notes in Markdown.",
    },
  },
  required: [
    "title",
    "emoji",
    "language",
    "summary",
    "keyPoints",
    "notesMarkdown",
  ],
  additionalProperties: false,
} as const;

export async function generateNoteContent(
  note: Note
): Promise<GeneratedNoteContent> {
  const system = `You are EasyNote, an expert note-taking assistant. You turn raw transcripts, documents and extracted text into clear, well-organized study notes.

Rules for notesMarkdown:
- Write in the same language as the source content.
- Start with a "## Overview" section (2-3 sentences).
- Organize the body with "##" section headings that follow the logical structure of the material; use "###" subsections where helpful.
- Use bullet points for facts, definitions, and examples; bold key terms.
- Include concrete details (numbers, names, formulas, steps) — notes must be able to replace re-watching/re-reading the source.
- End with a "## Key Takeaways" section of 3-6 bullets.
- Do NOT include a top-level "#" title (the app shows the title separately).
- Do not invent information that is not supported by the source.`;

  const user = `Create study notes from the following material.\n\n${noteMaterial(
    note
  )}`;

  return structuredRequest<GeneratedNoteContent>({
    system,
    user,
    schema: NOTE_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 30000,
  });
}

/* ------------------------------------------------------------------ */
/* Flashcards                                                          */
/* ------------------------------------------------------------------ */

const FLASHCARDS_SCHEMA = {
  type: "object",
  properties: {
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: { type: "string", description: "Question / prompt side." },
          back: { type: "string", description: "Answer / explanation side." },
        },
        required: ["front", "back"],
        additionalProperties: false,
      },
    },
  },
  required: ["cards"],
  additionalProperties: false,
} as const;

export async function generateFlashcards(
  note: Note,
  count: number
): Promise<Flashcard[]> {
  const system = `You create high-quality spaced-repetition flashcards from study material.
- Each card tests exactly one fact or concept.
- Fronts are specific questions (avoid yes/no); backs are concise, complete answers.
- Cover the most important material first; vary question styles (definition, why/how, application).
- Write in the same language as the source material.`;

  const user = `Create exactly ${count} flashcards from this material.\n\n${noteMaterial(
    note
  )}`;

  const result = await structuredRequest<{ cards: Flashcard[] }>({
    system,
    user,
    schema: FLASHCARDS_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 10000,
  });
  return result.cards.slice(0, count + 5);
}

/* ------------------------------------------------------------------ */
/* Quiz                                                                */
/* ------------------------------------------------------------------ */

const QUIZ_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Exactly 4 answer options.",
          },
          answerIndex: {
            type: "integer",
            description: "0-based index of the correct option.",
          },
          explanation: {
            type: "string",
            description: "Why the correct answer is right (1-2 sentences).",
          },
        },
        required: ["question", "options", "answerIndex", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
} as const;

export async function generateQuiz(
  note: Note,
  count: number
): Promise<QuizQuestion[]> {
  const system = `You write multiple-choice quiz questions that test understanding of study material.
- Exactly 4 options per question, with a single clearly-correct answer.
- Distractors must be plausible but wrong; avoid "all of the above".
- Mix recall questions with questions that require applying the material.
- Write in the same language as the source material.`;

  const user = `Write exactly ${count} multiple-choice questions from this material.\n\n${noteMaterial(
    note
  )}`;

  const result = await structuredRequest<{ questions: QuizQuestion[] }>({
    system,
    user,
    schema: QUIZ_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 12000,
  });
  return result.questions
    .filter(
      (q) =>
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.answerIndex >= 0 &&
        q.answerIndex < q.options.length
    )
    .slice(0, count + 5);
}

/* ------------------------------------------------------------------ */
/* Translation                                                         */
/* ------------------------------------------------------------------ */

const TRANSLATION_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    notesMarkdown: { type: "string" },
  },
  required: ["summary", "notesMarkdown"],
  additionalProperties: false,
} as const;

export async function translateNote(
  note: Note,
  targetLanguage: string
): Promise<{ summary: string; notesMarkdown: string }> {
  const system = `You are a professional translator. Translate study notes into the requested language.
- Preserve ALL Markdown structure exactly (headings, bullets, bold, tables).
- Keep technical terms accurate; where a term is usually kept in English, include the translation in parentheses on first use.
- Translate naturally — not word-for-word.`;

  const user = `Target language: ${targetLanguage}

Translate the summary and the notes below.

=== SUMMARY ===
${note.summary ?? ""}

=== NOTES (Markdown) ===
${truncateChars(note.notesMarkdown ?? "", MATERIAL_BUDGET)}`;

  return structuredRequest<{ summary: string; notesMarkdown: string }>({
    system,
    user,
    schema: TRANSLATION_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 30000,
  });
}

/* ------------------------------------------------------------------ */
/* Vision: extract text/content from an image                          */
/* ------------------------------------------------------------------ */

export async function extractFromImage(
  data: Buffer,
  mediaType: string
): Promise<string> {
  const client = anthropic();
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const mt = allowed.includes(mediaType) ? mediaType : "image/png";
  const stream = client.messages.stream({
    model: MODEL(),
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mt as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: data.toString("base64"),
            },
          },
          {
            type: "text",
            text: "Transcribe ALL text visible in this image (slides, whiteboard, handwriting, book page…), preserving structure. If the image contains diagrams or figures, describe them concisely in [brackets] where they appear. Output only the transcription/description — no commentary.",
          },
        ],
      },
    ],
  });
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") {
    throw new Error("The AI declined to process this image.");
  }
  return final.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
}

/* ------------------------------------------------------------------ */
/* PDF fallback: let Claude read the PDF directly (scanned PDFs etc.)  */
/* ------------------------------------------------------------------ */

export async function extractFromPdfViaClaude(data: Buffer): Promise<string> {
  const client = anthropic();
  const stream = client.messages.stream({
    model: MODEL(),
    max_tokens: 30000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: data.toString("base64"),
            },
          },
          {
            type: "text",
            text: "Extract the full text content of this document, preserving its structure with headings and paragraphs. Mark page boundaries as '[Page N]'. Output only the extracted text.",
          },
        ],
      },
    ],
  });
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") {
    throw new Error("The AI declined to process this document.");
  }
  return final.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
}
