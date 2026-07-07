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
