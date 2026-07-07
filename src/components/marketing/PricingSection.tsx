"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

const FREE_FEATURES = [
  "10 AI notes per month",
  "YouTube, PDF, image & text import",
  "Live recording with real-time transcript",
  "Flashcards & quizzes (starter sizes)",
  "Mind maps & AI chat (30 msgs/day)",
  "Uploads up to 25 MB",
];

const PRO_FEATURES = [
  "Unlimited AI notes",
  "Everything in Starter, unlimited",
  "Larger flashcard decks & quizzes",
  "Unlimited AI chat with your notes",
  "Uploads up to 200 MB",
  "Translate notes into 15+ languages",
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
      <div className="mb-8 flex items-center justify-center gap-3">
        <span
          className={`text-sm font-medium ${!yearly ? "text-slate-900" : "text-slate-400"}`}
        >
          Monthly
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          className={`relative h-7 w-13 rounded-full transition ${yearly ? "bg-brand-600" : "bg-slate-300"}`}
          style={{ width: 52 }}
          aria-label="Toggle yearly billing"
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${yearly ? "left-7" : "left-1"}`}
          />
        </button>
        <span
          className={`text-sm font-medium ${yearly ? "text-slate-900" : "text-slate-400"}`}
        >
          Yearly
          <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            Save 58%
          </span>
        </span>
      </div>

      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        {/* Starter */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Starter
          </div>
          <div className="mt-3 flex items-end gap-1.5">
            <span className="text-4xl font-extrabold text-slate-900">$0</span>
            <span className="pb-1 text-sm text-slate-500">forever</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Everything you need to try AI note-taking.
          </p>
          <Link
            href="/login?mode=signup"
            className="mt-5 block rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Start for free
          </Link>
          <ul className="mt-6 space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm text-slate-600">
                <Check size={17} className="mt-0.5 shrink-0 text-slate-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className="relative rounded-3xl border-2 border-brand-500 bg-gradient-to-b from-brand-50/70 to-white p-7 shadow-lg shadow-brand-100">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
            MOST POPULAR
          </div>
          <div className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Pro
          </div>
          <div className="mt-3 flex items-end gap-1.5">
            <span className="text-4xl font-extrabold text-slate-900">
              ${yearly ? "8.39" : "19.99"}
            </span>
            <span className="pb-1 text-sm text-slate-500">/ month</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {yearly
              ? "Billed yearly ($100.68/year)."
              : "Billed monthly. Cancel anytime."}
          </p>
          <Link
            href={`/price?checkout=${yearly ? "yearly" : "monthly"}`}
            className="mt-5 block rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Upgrade to Pro
          </Link>
          <ul className="mt-6 space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm text-slate-700">
                <Check size={17} className="mt-0.5 shrink-0 text-brand-600" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!compact && (
        <p className="mt-6 text-center text-xs text-slate-400">
          This is a self-hosted demo build — upgrading switches your local
          account to Pro instantly, no payment involved.
        </p>
      )}
    </div>
  );
}
