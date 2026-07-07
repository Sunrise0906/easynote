import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { NextRequest } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { getNote, uploadsDir } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

function toWebStream(stream: fs.ReadStream): ReadableStream {
  return Readable.toWeb(stream) as unknown as ReadableStream;
}

/** Serve the uploaded media file with HTTP Range support (audio seeking). */
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const note = await getNote(id);
  if (!note || note.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }
  if (!note.mediaFile) return jsonError("This note has no media file.", 404);

  const filePath = path.join(uploadsDir(), path.basename(note.mediaFile));
  let stat: fs.Stats;
  try {
    stat = await fsp.stat(filePath);
  } catch {
    return jsonError("Media file is missing.", 404);
  }

  const mime = note.mediaMime || "application/octet-stream";
  const range = req.headers.get("range");

  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
    if (isNaN(start) || start < 0) start = 0;
    if (isNaN(end) || end >= stat.size) end = stat.size - 1;
    if (start > end) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${stat.size}` },
      });
    }
    return new Response(
      toWebStream(fs.createReadStream(filePath, { start, end })),
      {
        status: 206,
        headers: {
          "Content-Type": mime,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=3600",
        },
      }
    );
  }

  return new Response(toWebStream(fs.createReadStream(filePath)), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
