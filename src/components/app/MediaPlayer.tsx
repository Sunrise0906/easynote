"use client";

import { MutableRefObject, useEffect, useRef } from "react";
import { NoteData } from "@/lib/types";

/**
 * Renders the note's attached media (YouTube embed / audio / video) and
 * installs a seek function into `seekRef` so the transcript can jump to
 * a timestamp.
 */
export default function MediaPlayer({
  note,
  seekRef,
}: {
  note: NoteData;
  seekRef: MutableRefObject<((t: number) => void) | null>;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  useEffect(() => {
    if (note.youtubeId) {
      seekRef.current = (t: number) => {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: "seekTo",
            args: [Math.max(0, Math.floor(t)), true],
          }),
          "*"
        );
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: [] }),
          "*"
        );
      };
    } else if (note.mediaFile) {
      seekRef.current = (t: number) => {
        const el = mediaRef.current;
        if (el) {
          el.currentTime = t;
          void el.play().catch(() => {});
        }
      };
    } else {
      seekRef.current = null;
    }
  }, [note.youtubeId, note.mediaFile, seekRef]);

  if (note.youtubeId) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-black">
        <div className="relative aspect-video w-full">
          <iframe
            ref={iframeRef}
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${note.youtubeId}?enablejsapi=1&rel=0`}
            title={note.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (note.mediaFile && (note.sourceType === "audio" || note.sourceType === "recording")) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <audio
          ref={(el) => {
            mediaRef.current = el;
          }}
          controls
          preload="metadata"
          className="w-full"
          src={`/api/notes/${note.id}/media`}
        />
      </div>
    );
  }

  if (note.mediaFile && note.sourceType === "video") {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-black">
        <video
          ref={(el) => {
            mediaRef.current = el;
          }}
          controls
          preload="metadata"
          className="max-h-96 w-full"
          src={`/api/notes/${note.id}/media`}
        />
      </div>
    );
  }

  if (note.mediaFile && note.sourceType === "image") {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-surface p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/notes/${note.id}/media`}
          alt={note.title}
          className="mx-auto max-h-96 rounded-lg object-contain"
        />
      </div>
    );
  }

  return null;
}
