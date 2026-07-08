"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { UserRound } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button, ErrorText, Field, inputClass } from "@/components/ui";
import { apiPost } from "@/lib/client";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/notes";
  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"form" | "guest" | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy("form");
    try {
      await apiPost(
        mode === "signup" ? "/api/auth/register" : "/api/auth/login",
        mode === "signup" ? { email, password, name } : { email, password }
      );
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(null);
    }
  };

  const guest = async () => {
    setError("");
    setBusy("guest");
    try {
      await apiPost("/api/auth/guest");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* left: form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 font-display text-2xl font-extrabold text-ink">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {mode === "signup"
              ? "Free forever. No credit card required."
              : "Sign in to your notes."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "signup" && (
              <Field label="Name">
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <input
                className={inputClass}
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "signup" ? "At least 8 characters" : "••••••••"
                }
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
              />
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button
              type="submit"
              loading={busy === "form"}
              className="w-full py-2.5"
            >
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="secondary"
            onClick={guest}
            loading={busy === "guest"}
            className="w-full py-2.5"
          >
            <UserRound size={16} />
            Continue as guest
          </Button>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  className="font-semibold text-primary hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to Recall?{" "}
                <button
                  className="font-semibold text-primary hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </>
            )}
          </p>
          <div className="mt-6 rounded-lg border border-border bg-surface-2 px-4 py-3 text-center text-xs text-muted">
            Want a look around? Demo account:{" "}
            <button
              className="font-mono font-semibold text-primary hover:underline"
              onClick={() => {
                setMode("signin");
                setEmail("demo@easynote.local");
                setPassword("demo1234");
              }}
            >
              demo@easynote.local / demo1234
            </button>
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* right: showcase */}
      <div className="hidden bg-primary lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-16">
        <div className="max-w-md text-primary-ink">
          <div className="font-display text-3xl font-extrabold leading-snug">
            “The fastest way to turn an hour of lecture into ten minutes of
            review.”
          </div>
          <div className="mt-8 space-y-3.5">
            {[
              "Record, upload, or paste a link",
              "Get notes, summary & transcript",
              "Study with flashcards, quizzes & AI chat",
            ].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-ink/20 text-sm font-bold">
                  {i + 1}
                </span>
                <span className="text-primary-ink/80">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
