import crypto from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { config } from "./config";
import {
  User,
  createSession,
  createUserIfAbsent,
  deleteSession,
  getSession,
  getUserByEmail,
  getUserById,
} from "./store";
import { newId, newToken } from "./utils";

/* ---------------- password hashing (scrypt, no external deps) ------ */

const scrypt = promisify(crypto.scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

// A precomputed hash used to spend the same CPU on unknown emails, so login
// timing can't distinguish registered from unregistered accounts.
const DUMMY_HASH =
  "scrypt$0000000000000000000000000000000000000000000000000000000000000000$" +
  crypto
    .scryptSync("dummy-password", "0".repeat(64), 64)
    .toString("hex");

/** Async scrypt hashing — does not block the event loop. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export async function verifyPassword(
  password: string,
  stored?: string
): Promise<boolean> {
  // Always run a full scrypt so timing is independent of whether the account
  // exists / has a usable hash (constant-cost verification).
  const target = stored && stored.startsWith("scrypt$") ? stored : DUMMY_HASH;
  const [, salt, hash] = target.split("$");
  const candidate = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  const match =
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected);
  // If we verified against the dummy hash, the answer is always false.
  return Boolean(stored && stored.startsWith("scrypt$")) && match;
}

/* ---------------- session helpers ---------------------------------- */

export async function startSession(userId: string): Promise<string> {
  const token = newToken(24);
  const now = Date.now();
  await createSession({
    token,
    userId,
    createdAt: now,
    expiresAt: now + config.session.maxAgeDays * 24 * 3600 * 1000,
  });
  const jar = await cookies();
  jar.set(config.session.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: config.session.maxAgeDays * 24 * 3600,
  });
  return token;
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(config.session.cookieName)?.value;
  if (token) await deleteSession(token);
  jar.delete(config.session.cookieName);
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(config.session.cookieName)?.value;
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  return getUserById(session.userId);
}

/* ---------------- account creation --------------------------------- */

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<{ user?: User; error?: string }> {
  const norm = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm))
    return { error: "Please enter a valid email address." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  if (password.length > 200)
    return { error: "Password is too long." };
  if (norm.length > 200) return { error: "Email is too long." };
  // Fast pre-check for a friendly message; the authoritative check is the
  // atomic createUserIfAbsent below (closes the TOCTOU race).
  if (await getUserByEmail(norm))
    return { error: "An account with this email already exists." };

  const user: User = {
    id: newId("u"),
    email: norm,
    name: (name?.trim() || norm.split("@")[0]).slice(0, 80),
    passwordHash: await hashPassword(password),
    guest: false,
    plan: "free",
    usage: { notes: {}, chat: {} },
    createdAt: Date.now(),
  };
  const result = await createUserIfAbsent(user);
  if (!result.ok) {
    return { error: "An account with this email already exists." };
  }
  return { user };
}

export async function createGuestUser(): Promise<User> {
  const id = newId("u");
  const user: User = {
    id,
    email: `${id}@guest.easynote.local`,
    name: "Guest",
    guest: true,
    plan: "free",
    usage: { notes: {}, chat: {} },
    createdAt: Date.now(),
  };
  await createUserIfAbsent(user);
  return user;
}
