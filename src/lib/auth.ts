import crypto from "crypto";
import { cookies } from "next/headers";
import { config } from "./config";
import {
  User,
  createSession,
  deleteSession,
  getSession,
  getUserByEmail,
  getUserById,
  saveUser,
} from "./store";
import { newId, newToken } from "./utils";

/* ---------------- password hashing (scrypt, no external deps) ------ */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored?: string): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
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
  if (await getUserByEmail(norm))
    return { error: "An account with this email already exists." };

  const user: User = {
    id: newId("u"),
    email: norm,
    name: name?.trim() || norm.split("@")[0],
    passwordHash: hashPassword(password),
    guest: false,
    plan: "free",
    usage: { notes: {}, chat: {} },
    createdAt: Date.now(),
  };
  await saveUser(user);
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
  await saveUser(user);
  return user;
}
