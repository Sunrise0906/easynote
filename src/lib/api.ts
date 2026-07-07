import { NextResponse } from "next/server";
import { currentUser } from "./auth";
import { User } from "./store";

export function jsonError(
  message: string,
  status = 400,
  code?: string
): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

/** Resolve the authenticated user or return a ready 401 response. */
export async function requireUser(): Promise<
  { user: User; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await currentUser();
  if (!user) {
    return { response: jsonError("Not signed in.", 401, "unauthorized") };
  }
  return { user };
}
