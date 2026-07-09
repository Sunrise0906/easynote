import { Flashcard, Note, QuizQuestion, transcriptFullText } from "../store";
import { truncateChars } from "../utils";
import { anthropic, MODEL } from "./client";
import { generateJSON, visionExtract } from "./provider";

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
  note: Note,
  modelId?: string | null
): Promise<GeneratedNoteContent> {
  const system = `You are Recall, an expert note-taking assistant. You turn raw transcripts, documents and extracted text into clear, well-organized study notes.

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

  const result = await generateJSON<GeneratedNoteContent>({
    system,
    user,
    schema: NOTE_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 30000,
    modelId,
  });
  // Guard against a model returning a parseable-but-empty object — surface it
  // as a retryable error instead of persisting a blank "ready" note.
  if (!result.notesMarkdown?.trim() || !result.summary?.trim()) {
    throw new Error("The AI returned incomplete notes. Please try again.");
  }
  return result;
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
  count: number,
  modelId?: string | null
): Promise<Flashcard[]> {
  const system = `You create high-quality spaced-repetition flashcards from study material.
- Each card tests exactly one fact or concept.
- Fronts are specific questions (avoid yes/no); backs are concise, complete answers.
- Cover the most important material first; vary question styles (definition, why/how, application).
- Write in the same language as the source material.`;

  const user = `Create exactly ${count} flashcards from this material.\n\n${noteMaterial(
    note
  )}`;

  const result = await generateJSON<{ cards: Flashcard[] }>({
    system,
    user,
    schema: FLASHCARDS_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 10000,
    modelId,
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
  count: number,
  modelId?: string | null
): Promise<QuizQuestion[]> {
  const system = `You write multiple-choice quiz questions that test understanding of study material.
- Exactly 4 options per question, with a single clearly-correct answer.
- Distractors must be plausible but wrong; avoid "all of the above".
- Mix recall questions with questions that require applying the material.
- Write in the same language as the source material.`;

  const user = `Write exactly ${count} multiple-choice questions from this material.\n\n${noteMaterial(
    note
  )}`;

  const result = await generateJSON<{ questions: QuizQuestion[] }>({
    system,
    user,
    schema: QUIZ_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 12000,
    modelId,
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
  targetLanguage: string,
  modelId?: string | null
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

  return generateJSON<{ summary: string; notesMarkdown: string }>({
    system,
    user,
    schema: TRANSLATION_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 30000,
    modelId,
  });
}

/* ------------------------------------------------------------------ */
/* Feynman mode: grade a spoken explanation (content + presentation)   */
/* ------------------------------------------------------------------ */

export interface FeynmanEval {
  overall: number;
  summary: string;
  accuracy: number;
  completeness: number;
  covered: string[];
  missed: string[];
  errors: string[];
  presentation: {
    clarity: number;
    structure: number;
    conciseness: number;
    fillerWords: string[];
    pace: string;
    tips: string[];
  };
  nextStep: string;
}

const FEYNMAN_SCHEMA = {
  type: "object",
  properties: {
    overall: { type: "integer", description: "0-100 overall mastery score." },
    summary: { type: "string", description: "2-3 sentence encouraging verdict." },
    accuracy: { type: "integer", description: "0-100: correctness vs source." },
    completeness: {
      type: "integer",
      description: "0-100: how much of the key material was covered.",
    },
    covered: {
      type: "array",
      items: { type: "string" },
      description: "Key points the learner explained well.",
    },
    missed: {
      type: "array",
      items: { type: "string" },
      description: "Important points from the source they left out.",
    },
    errors: {
      type: "array",
      items: { type: "string" },
      description: "Things they said that are wrong, imprecise, or misleading.",
    },
    presentation: {
      type: "object",
      properties: {
        clarity: { type: "integer" },
        structure: { type: "integer" },
        conciseness: { type: "integer" },
        fillerWords: {
          type: "array",
          items: { type: "string" },
          description: "Filler words/verbal tics noticed (e.g. 'um', 'like', 'basically'), with counts if notable.",
        },
        pace: { type: "string", description: "Brief note on pacing/length." },
        tips: {
          type: "array",
          items: { type: "string" },
          description: "2-3 concrete presentation/delivery tips.",
        },
      },
      required: ["clarity", "structure", "conciseness", "fillerWords", "pace", "tips"],
      additionalProperties: false,
    },
    nextStep: {
      type: "string",
      description: "One concrete thing to do next to improve.",
    },
  },
  required: [
    "overall",
    "summary",
    "accuracy",
    "completeness",
    "covered",
    "missed",
    "errors",
    "presentation",
    "nextStep",
  ],
  additionalProperties: false,
} as const;

export async function evaluateFeynman(
  note: Note,
  explanation: string,
  topic: string,
  meta: { durationSec?: number; wordCount?: number },
  modelId?: string | null
): Promise<FeynmanEval> {
  const system = `You are a sharp, encouraging tutor AND a presentation coach. A learner is using the Feynman technique — explaining a topic out loud in their own words to prove they understand it. You have the SOURCE MATERIAL (ground truth) and a transcript of what they said.

Judge on two axes:
1) CONTENT — accuracy (is what they said correct per the source?), completeness (did they cover the important points?), covered (what they nailed), missed (key source points they skipped), errors (wrong or imprecise claims).
2) PRESENTATION / communication skill — clarity, logical structure (did they build up the idea in a sensible order?), conciseness (rambling vs tight), filler words / verbal tics, and pacing. Give 2-3 concrete delivery tips.

Be specific and reference the material. Be honest with scores (don't inflate) but constructive. Score 0-100. Write in the language the learner used.`;

  const wordInfo = meta.wordCount ? `${meta.wordCount} words` : "";
  const timeInfo = meta.durationSec
    ? `${Math.round(meta.durationSec)}s spoken`
    : "";
  const user = `TOPIC: ${topic}

=== SOURCE MATERIAL (ground truth) ===
${truncateChars(note.notesMarkdown || transcriptFullText(note), 40_000)}

=== LEARNER'S SPOKEN EXPLANATION ${[wordInfo, timeInfo].filter(Boolean).join(", ")} ===
${explanation}`;

  return generateJSON<FeynmanEval>({
    system,
    user,
    schema: FEYNMAN_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 4000,
    modelId,
  });
}

/* ------------------------------------------------------------------ */
/* Vision: extract text/content from an image                          */
/* ------------------------------------------------------------------ */

const IMAGE_API_LIMIT = 5 * 1024 * 1024; // vision API byte limit

export async function extractFromImage(
  data: Buffer,
  mediaType: string,
  modelId?: string | null
): Promise<string> {
  if (data.length > IMAGE_API_LIMIT) {
    throw new Error(
      "This image is too large to read (over 5 MB). Please use a smaller or more compressed image."
    );
  }
  return visionExtract(
    data,
    mediaType,
    "Transcribe ALL text visible in this image (slides, whiteboard, handwriting, book page…), preserving structure. If the image contains diagrams or figures, describe them concisely in [brackets] where they appear. Output only the transcription/description — no commentary.",
    modelId
  );
}

/* ------------------------------------------------------------------ */
/* PDF fallback: let Claude read the PDF directly (scanned PDFs etc.)  */
/* ------------------------------------------------------------------ */

const PDF_API_LIMIT = 20 * 1024 * 1024; // stay under the 32 MB request cap after base64

export async function extractFromPdfViaClaude(data: Buffer): Promise<string> {
  if (data.length > PDF_API_LIMIT) {
    throw new Error(
      "This scanned PDF is too large to read with AI (over 20 MB). Please upload a smaller file or one with selectable text."
    );
  }
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
  const text = final.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  // Very long scanned PDFs can hit the output cap; flag the truncation rather
  // than silently dropping the tail.
  if (final.stop_reason === "max_tokens") {
    return (
      text +
      "\n\n[Note: this document was long and only the first portion could be read.]"
    );
  }
  return text;
}
