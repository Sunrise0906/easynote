"use client";

/** Small fetch helpers for client components. */

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function parse<T>(res: Response): Promise<T> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const b = body as { error?: string; code?: string } | null;
    throw new ApiError(
      b?.error || `Request failed (${res.status})`,
      res.status,
      b?.code
    );
  }
  return body as T;
}

export async function apiGet<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { cache: "no-store" }));
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return parse<T>(
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  );
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  return parse<T>(
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function apiDelete<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { method: "DELETE" }));
}

/**
 * POST a chat message and stream the SSE reply.
 * Calls onText for each token chunk; resolves with the full reply.
 */
export async function streamChat(
  noteId: string,
  message: string,
  onText: (chunk: string) => void
): Promise<string> {
  const res = await fetch(`/api/notes/${noteId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok || !res.body) {
    let msg = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const b = (await res.json()) as { error?: string; code?: string };
      if (b?.error) msg = b.error;
      code = b?.code;
    } catch {
      /* ignore */
    }
    throw new ApiError(msg, res.status, code);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const evt of events) {
      const line = evt
        .split("\n")
        .find((l) => l.startsWith("data: "));
      if (!line) continue;
      try {
        const payload = JSON.parse(line.slice(6)) as {
          text?: string;
          done?: boolean;
          error?: string;
        };
        if (payload.text) {
          full += payload.text;
          onText(payload.text);
        }
        if (payload.error) throw new ApiError(payload.error, 500);
      } catch (e) {
        if (e instanceof ApiError) throw e;
        /* ignore malformed frames */
      }
    }
  }
  return full;
}
