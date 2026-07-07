import crypto from "crypto";

export function newId(prefix = ""): string {
  const raw = crypto.randomBytes(9).toString("base64url");
  return prefix ? `${prefix}_${raw}` : raw;
}

export function newToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function nowMs(): number {
  return Date.now();
}

/** "3:05" or "1:02:09" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function countWords(text: string): number {
  if (!text) return 0;
  // Handles latin words plus CJK characters (counted individually).
  const cjk = (text.match(/[一-鿿぀-ヿ가-힯]/g) || [])
    .length;
  const latin = (text.match(/[A-Za-z0-9]+(?:'[A-Za-z]+)?/g) || []).length;
  return cjk + latin;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Current month key like "2026-07" (used for monthly quotas). */
export function monthKey(ts = Date.now()): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Current day key like "2026-07-06" (used for daily quotas). */
export function dayKey(ts = Date.now()): string {
  const d = new Date(ts);
  return `${monthKey(ts)}-${String(d.getDate()).padStart(2, "0")}`;
}

export function truncateChars(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n\n[… content truncated for length …]";
}

export function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
