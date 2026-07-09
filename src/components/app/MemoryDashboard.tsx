"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Brain, Flame, TrendingUp } from "lucide-react";
import { apiGet } from "@/lib/client";
import { MemoryStatsData } from "@/lib/types";

function masteryColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  if (pct > 0) return "bg-red-500";
  return "bg-border";
}

export default function MemoryDashboard() {
  const [stats, setStats] = useState<MemoryStatsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<{ stats: MemoryStatsData }>("/api/memory")
      .then((d) => setStats(d.stats))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not load memory data.")
      );
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-muted">
        {error}
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );
  }

  const empty = stats.totalCards === 0;
  const maxActivity = Math.max(1, ...stats.activity.map((a) => a.count));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">
            Memory
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            What&apos;s sticking, what&apos;s slipping, and what to review next.
          </p>
        </div>
        {stats.dueNow > 0 && (
          <Link
            href="/review"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink transition hover:opacity-90"
          >
            Review {stats.dueNow} due →
          </Link>
        )}
      </div>

      {empty ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <Brain size={36} className="mx-auto text-primary" />
          <div className="mt-3 font-display font-bold text-ink">
            Your memory dashboard is empty
          </div>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
            Generate flashcards on any note. Every card enters a spaced-repetition
            schedule, and this page tracks how well you remember it over time.
          </p>
          <Link
            href="/notes"
            className="mt-5 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
          >
            Go to my notes
          </Link>
        </div>
      ) : (
        <>
          {/* stat tiles */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={<TrendingUp size={16} />}
              label="Retention"
              value={`${stats.retention}%`}
              hint="avg recall probability now"
            />
            <Stat
              icon={<Brain size={16} />}
              label="Cards in memory"
              value={`${stats.reviewedCards}`}
              hint={`${stats.newCards} new · ${stats.totalCards} total`}
            />
            <Stat
              icon={<AlertTriangle size={16} />}
              label="Due now"
              value={`${stats.dueNow}`}
              hint={`${stats.dueToday} due today`}
              accent={stats.dueNow > 0}
            />
            <Stat
              icon={<Flame size={16} />}
              label="Streak"
              value={`${stats.streak}`}
              hint="days in a row"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            {/* per-note mastery */}
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-display font-bold text-ink">
                Mastery by note
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Weakest first — where your recall needs work.
              </p>
              <div className="mt-4 space-y-3">
                {stats.notes.map((n) => (
                  <Link
                    key={n.noteId}
                    href={`/notes/${n.noteId}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate pr-3 font-medium text-ink">
                        {n.title}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted">
                        {n.mastery}%
                        {n.due > 0 && (
                          <span className="ml-2 text-accent">{n.due} due</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full transition-all ${masteryColor(n.mastery)}`}
                        style={{ width: `${n.mastery}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <div className="space-y-6">
              {/* forgetting soon */}
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="font-display font-bold text-ink">
                  Forgetting soon
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Lowest recall probability right now.
                </p>
                <div className="mt-4 space-y-2.5">
                  {stats.forgettingSoon.length === 0 ? (
                    <p className="text-sm text-muted">
                      Nothing at risk — your memory is in good shape. ✨
                    </p>
                  ) : (
                    stats.forgettingSoon.map((c) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <span
                          className={`w-9 shrink-0 rounded-md px-1 py-0.5 text-center text-[11px] font-bold ${
                            c.retrievability < 60
                              ? "bg-red-500/15 text-red-600"
                              : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {c.retrievability}%
                        </span>
                        <span className="truncate text-sm text-ink">
                          {c.front}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* activity */}
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="font-display font-bold text-ink">
                  Review activity
                </h2>
                <p className="mt-0.5 text-xs text-muted">Last 30 days</p>
                <div className="mt-4 flex h-24 items-end gap-[3px]">
                  {stats.activity.map((a) => (
                    <div
                      key={a.day}
                      title={`${a.day}: ${a.count}`}
                      className="flex-1 rounded-t bg-primary/70"
                      style={{
                        height: `${Math.max(3, (a.count / maxActivity) * 100)}%`,
                        opacity: a.count === 0 ? 0.25 : 1,
                      }}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-surface p-4 ${accent ? "border-accent/40" : "border-border"}`}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <span className={accent ? "text-accent" : "text-primary"}>{icon}</span>
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-extrabold text-ink">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-faint">{hint}</div>
    </div>
  );
}
