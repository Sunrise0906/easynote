import { SourceType } from "./types";

/**
 * Map a stored note's source type to a SAFE Content-Type for serving its
 * media. We never echo the client-supplied MIME (that allows serving
 * text/html or image/svg+xml inline → stored XSS). Anything we can't map to a
 * known-inert media type is served as an opaque download.
 */
export function safeMediaContentType(
  sourceType: SourceType,
  storedMime: string | undefined
): { contentType: string; inline: boolean } {
  const mime = (storedMime || "").toLowerCase();

  if (sourceType === "image") {
    const allowed = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (allowed.includes(mime)) return { contentType: mime, inline: true };
    return { contentType: "application/octet-stream", inline: false };
  }
  if (sourceType === "audio" || sourceType === "recording") {
    if (mime.startsWith("audio/")) return { contentType: mime, inline: true };
    return { contentType: "audio/mpeg", inline: true };
  }
  if (sourceType === "video") {
    if (mime.startsWith("video/")) return { contentType: mime, inline: true };
    return { contentType: "video/mp4", inline: true };
  }
  if (sourceType === "pdf") {
    return { contentType: "application/pdf", inline: false };
  }
  return { contentType: "application/octet-stream", inline: false };
}

/** Normalize an uploaded file's MIME to a trusted value at ingest time. */
export function normalizeUploadMime(
  sourceType: SourceType,
  clientMime: string | undefined
): string {
  return safeMediaContentType(sourceType, clientMime).contentType;
}
