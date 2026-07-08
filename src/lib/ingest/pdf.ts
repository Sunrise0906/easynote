import { TranscriptSegment } from "../store";

/**
 * Extract text from a PDF using pdf.js (via unpdf — pure JS, no workers).
 * Returns one segment per page; `start` carries the 1-based page number.
 */
export async function extractPdfText(
  data: Buffer
): Promise<{ segments: TranscriptSegment[]; totalChars: number }> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(data));
  const { text } = await extractText(pdf, { mergePages: false });
  const pages: string[] = Array.isArray(text) ? text : [String(text)];

  const segments: TranscriptSegment[] = [];
  let totalChars = 0;
  pages.forEach((pageText, i) => {
    const cleaned = (pageText || "").replace(/\s+\n/g, "\n").trim();
    totalChars += cleaned.length;
    if (cleaned.length > 0) {
      segments.push({ start: i + 1, text: cleaned });
    }
  });
  return { segments, totalChars };
}

/**
 * Rasterize the first `maxPages` pages of a scanned PDF to PNG buffers, so a
 * vision model can OCR them. Uses unpdf's renderer backed by @napi-rs/canvas
 * (which ships musl prebuilds, so it works in the Alpine Docker image).
 */
export async function renderPdfPages(
  data: Buffer,
  maxPages: number
): Promise<{ pages: Buffer[]; total: number; truncated: boolean }> {
  const { getDocumentProxy, renderPageAsImage } = await import("unpdf");
  const bytes = new Uint8Array(data);
  const pdf = await getDocumentProxy(bytes);
  const total = pdf.numPages;
  const n = Math.min(total, Math.max(1, maxPages));
  const canvasImport = () => import("@napi-rs/canvas");
  const pages: Buffer[] = [];
  for (let i = 1; i <= n; i++) {
    let png = await renderPageAsImage(new Uint8Array(data), i, {
      scale: 2,
      canvasImport,
    });
    let buf = Buffer.from(png);
    // Keep each page under the ~5 MB vision-API limit.
    if (buf.length > 4.5 * 1024 * 1024) {
      png = await renderPageAsImage(new Uint8Array(data), i, {
        scale: 1,
        canvasImport,
      });
      buf = Buffer.from(png);
    }
    pages.push(buf);
  }
  return { pages, total, truncated: total > n };
}
