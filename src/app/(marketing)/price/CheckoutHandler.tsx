"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Loader2, X } from "lucide-react";

/**
 * Handles /price?checkout=monthly|yearly — the demo checkout dialog.
 * If the visitor isn't signed in, they're sent to login and bounced back.
 */
export default function CheckoutHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const interval = params.get("checkout");
  const [state, setState] = useState<
    "idle" | "confirm" | "working" | "done" | "signin"
  >("idle");

  useEffect(() => {
    if (interval !== "monthly" && interval !== "yearly") return;
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setState(d.user ? "confirm" : "signin");
      })
      .catch(() => setState("signin"));
    return () => {
      cancelled = true;
    };
  }, [interval]);

  if (state === "idle" || (interval !== "monthly" && interval !== "yearly")) {
    return null;
  }

  const price = interval === "yearly" ? "$100.68 / year" : "$19.99 / month";

  const close = () => {
    setState("idle");
    router.replace("/price");
  };

  const confirm = async () => {
    setState("working");
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upgrade", interval }),
    });
    setState(res.ok ? "done" : "confirm");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-7 shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-lg font-bold text-ink">
            {state === "done" ? "Welcome to Pro! 🎉" : "Upgrade to Pro"}
          </h3>
          <button onClick={close} className="rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {state === "signin" && (
          <div className="mt-4">
            <p className="text-sm text-muted">
              Create a free account (or sign in) first, then come back to
              upgrade.
            </p>
            <a
              href={`/login?next=${encodeURIComponent(`/price?checkout=${interval}`)}`}
              className="mt-5 block rounded-md bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-ink hover:opacity-90"
            >
              Sign in / create account
            </a>
          </div>
        )}

        {(state === "confirm" || state === "working") && (
          <div className="mt-4">
            <div className="rounded-md bg-surface-2 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Recall Pro</span>
                <span className="font-semibold text-ink">{price}</span>
              </div>
              <div className="mt-1 text-xs text-muted">
                Demo checkout — no real payment is processed.
              </div>
            </div>
            <button
              onClick={confirm}
              disabled={state === "working"}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink hover:opacity-90 disabled:opacity-60"
            >
              {state === "working" && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Confirm upgrade
            </button>
          </div>
        )}

        {state === "done" && (
          <div className="mt-4 text-center">
            <BadgeCheck size={48} className="mx-auto text-emerald-500" />
            <p className="mt-3 text-sm text-muted">
              Your account now has unlimited notes, bigger decks and unlimited
              chat.
            </p>
            <a
              href="/notes"
              className="mt-5 block rounded-md bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-ink hover:opacity-90"
            >
              Go to my notes
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
