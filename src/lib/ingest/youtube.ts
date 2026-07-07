import { TranscriptSegment } from "../store";

export interface YoutubeInfo {
  videoId: string;
  title: string;
  author: string;
  durationSec: number;
  segments: TranscriptSegment[];
}

export function parseYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const m = url.pathname.match(
        /^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/
      );
      if (m) return m[1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // "asr" for auto-generated
  name?: { runs?: { text: string }[]; simpleText?: string };
}

/**
 * Fetch video metadata + caption track list via YouTube's InnerTube player
 * endpoint (the same API the mobile clients use — no API key required).
 */
async function fetchPlayerResponse(videoId: string): Promise<{
  title: string;
  author: string;
  durationSec: number;
  tracks: CaptionTrack[];
}> {
  const res = await fetch(
    "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip",
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "20.10.38",
            androidSdkVersion: 34,
            hl: "en",
          },
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`YouTube returned HTTP ${res.status}.`);
  }
  const data = (await res.json()) as {
    playabilityStatus?: { status?: string; reason?: string };
    videoDetails?: {
      title?: string;
      author?: string;
      lengthSeconds?: string;
    };
    captions?: {
      playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] };
    };
  };

  const status = data.playabilityStatus?.status;
  if (status && status !== "OK") {
    throw new Error(
      `This video is not accessible (${data.playabilityStatus?.reason || status}).`
    );
  }
  return {
    title: data.videoDetails?.title || "YouTube video",
    author: data.videoDetails?.author || "",
    durationSec: Number(data.videoDetails?.lengthSeconds || 0),
    tracks:
      data.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [],
  };
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;
  // Prefer human captions over auto-generated; prefer English, then anything.
  const human = tracks.filter((t) => t.kind !== "asr");
  const pool = human.length > 0 ? human : tracks;
  return (
    pool.find((t) => t.languageCode?.startsWith("en")) ??
    pool[0]
  );
}

async function fetchTrackSegments(
  track: CaptionTrack
): Promise<TranscriptSegment[]> {
  const url = new URL(track.baseUrl);
  url.searchParams.set("fmt", "json3");
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Caption fetch failed (HTTP ${res.status}).`);
  const data = (await res.json()) as {
    events?: {
      tStartMs?: number;
      dDurationMs?: number;
      segs?: { utf8?: string }[];
    }[];
  };
  const raw = (data.events ?? [])
    .map((e) => ({
      start: (e.tStartMs ?? 0) / 1000,
      end: ((e.tStartMs ?? 0) + (e.dDurationMs ?? 0)) / 1000,
      text: (e.segs ?? [])
        .map((s) => s.utf8 ?? "")
        .join("")
        .replace(/\s+/g, " ")
        .trim(),
    }))
    .filter((s) => s.text.length > 0);

  // Merge tiny caption lines into ~sentence-sized segments (~25s / 300 chars).
  const merged: TranscriptSegment[] = [];
  for (const seg of raw) {
    const last = merged[merged.length - 1];
    if (
      last &&
      seg.start - last.start < 25 &&
      (last.text + " " + seg.text).length < 300
    ) {
      last.text = `${last.text} ${seg.text}`;
      last.end = seg.end;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

export async function fetchYoutubeTranscript(
  videoId: string
): Promise<YoutubeInfo> {
  const info = await fetchPlayerResponse(videoId);
  const track = pickTrack(info.tracks);
  if (!track) {
    throw new Error(
      "This video has no captions available. Try another video, or download its audio and upload it instead."
    );
  }
  const segments = await fetchTrackSegments(track);
  if (segments.length === 0) {
    throw new Error("Could not read captions for this video.");
  }
  return {
    videoId,
    title: info.title,
    author: info.author,
    durationSec: info.durationSec,
    segments,
  };
}
