import { NextRequest } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { getNote, Note } from "@/lib/store";
import { formatClock } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

function buildMarkdown(note: Note): string {
  const lines: string[] = [`# ${note.emoji} ${note.title}`, ""];
  if (note.summary) {
    lines.push("> " + note.summary.replace(/\n/g, "\n> "), "");
  }
  if (note.keyPoints?.length) {
    lines.push("## Key Points", "");
    for (const p of note.keyPoints) lines.push(`- ${p}`);
    lines.push("");
  }
  if (note.notesMarkdown) {
    lines.push(note.notesMarkdown.trim(), "");
  }
  return lines.join("\n");
}

function buildTranscript(note: Note): string {
  const isTimed = ["youtube", "audio", "video", "recording"].includes(
    note.sourceType
  );
  return note.transcript
    .map((s) =>
      isTimed
        ? `[${formatClock(s.start)}] ${s.text}`
        : note.sourceType === "pdf"
          ? `[Page ${s.start}] ${s.text}`
          : s.text
    )
    .join("\n\n");
}

/** GET ?format=md|txt|transcript|json — download the note. */
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const note = await getNote(id);
  if (!note || note.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }

  const format = req.nextUrl.searchParams.get("format") || "md";
  const safeTitle =
    note.title.replace(/[^\w一-鿿 -]+/g, "").trim().slice(0, 60) ||
    "note";

  if (format === "json") {
    return new Response(JSON.stringify(note, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          safeTitle
        )}.json"`,
      },
    });
  }
  if (format === "transcript") {
    return new Response(buildTranscript(note), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          safeTitle
        )}-transcript.txt"`,
      },
    });
  }
  const md = buildMarkdown(note);
  if (format === "txt") {
    const plain = md
      .replace(/^#+\s*/gm, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/^>\s?/gm, "");
    return new Response(plain, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          safeTitle
        )}.txt"`,
      },
    });
  }
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        safeTitle
      )}.md"`,
    },
  });
}
