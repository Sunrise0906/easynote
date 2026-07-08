"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

const FREE_FEATURES = [
  "10 AI notes per month",
  "Every source: record, upload, YouTube, PDF, image, text",
  "Flashcards, quizzes & mind maps",
  "Chat tutor (30 messages/day)",
  "All four themes",
  "Uploads up to 25 MB",
];

const PRO_FEATURES = [
  "Unlimited AI notes",
  "Unlimited chat tutor",
  "Bigger flashcard decks & quizzes",
  "Uploads up to 200 MB",
  "Translate into 15+ languages",
  "Priority processing",
];

export default function PricingSection({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [yearly, setYearly] = useState(true);

  return (
    <div>
      <div className="mb-9 flex items-center justify-center gap-3">
        <span
          className={`text-sm font-medium ${!yearly ? "text-ink" : "text-muted"}`}
        >
          Monthly
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          className="relative h-7 rounded-full bg-surface-2 ring-1 ring-border transition"
          style={{ width: 52 }}
          aria-label="Toggle yearly billing"
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-primary transition-all ${yearly ? "left-7" : "left-1"}`}
          />
        </button>
        <span
          className={`text-sm font-medium ${yearly ? "text-ink" : "text-muted"}`}
        >
          Yearly
          <span className="ml-1.5 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
            −58%
          </span>
        </span>
      </div>

      <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-lg border border-border bg-surface p-7">
          <div className="font-display text-sm font-semibold text-muted">
            Starter
          </div>
          <div className="mt-3 flex items-end gap-1.5">
            <span className="font-display text-5xl font-bold text-ink">$0</span>
            <span className="pb-1.5 text-sm text-muted">forever</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            The full toolkit, for getting started.
          </p>
          <Link
            href="/login?mode=signup"
            className="mt-5 block rounded-md border border-border px-4 py-2.5 text-center text-sm font-semibold text-ink transition hover:border-ink/30"
          >
            Start free
          </Link>
          <ul className="mt-6 space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm text-muted">
                <Check size={17} className="mt-0.5 shrink-0 text-muted" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className="relative rounded-lg border-2 border-primary bg-surface p-7">
          <div className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-ink">
            Most popular
          </div>
          <div className="font-display text-sm font-semibold text-primary">
            Pro
          </div>
          <div className="mt-3 flex items-end gap-1.5">
            <span className="font-display text-5xl font-bold text-ink">
              ${yearly ? "8.39" : "19.99"}
            </span>
            <span className="pb-1.5 text-sm text-muted">/ month</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {yearly ? "Billed yearly ($100.68)." : "Billed monthly. Cancel anytime."}
          </p>
          <Link
            href={`/price?checkout=${yearly ? "yearly" : "monthly"}`}
            className="mt-5 block rounded-md bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-ink transition hover:opacity-90"
          >
            Upgrade to Pro
          </Link>
          <ul className="mt-6 space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm text-ink">
                <Check size={17} className="mt-0.5 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!compact && (
        <p className="mt-6 text-center text-xs text-muted">
          Self-hosted demo build — upgrading flips your local account to Pro
          instantly, no payment.
        </p>
      )}
    </div>
  );
}
