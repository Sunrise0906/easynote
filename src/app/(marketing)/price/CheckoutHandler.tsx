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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {state === "done" ? "Welcome to Pro! 🎉" : "Upgrade to Pro"}
          </h3>
          <button onClick={close} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {state === "signin" && (
          <div className="mt-4">
            <p className="text-sm text-slate-600">
              Create a free account (or sign in) first, then come back to
              upgrade.
            </p>
            <a
              href={`/login?next=${encodeURIComponent(`/price?checkout=${interval}`)}`}
              className="mt-5 block rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700"
            >
              Sign in / create account
            </a>
          </div>
        )}

        {(state === "confirm" || state === "working") && (
          <div className="mt-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">EasyNote Pro</span>
                <span className="font-semibold text-slate-900">{price}</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Demo checkout — no real payment is processed.
              </div>
            </div>
            <button
              onClick={confirm}
              disabled={state === "working"}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
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
            <p className="mt-3 text-sm text-slate-600">
              Your account now has unlimited notes, bigger decks and unlimited
              chat.
            </p>
            <a
              href="/notes"
              className="mt-5 block rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700"
            >
              Go to my notes
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
