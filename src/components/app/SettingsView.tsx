"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Crown, KeyRound, Server } from "lucide-react";
import { Button } from "../ui";
import { apiGet, apiPost } from "@/lib/client";
import { MeResponse } from "@/lib/types";

export default function SettingsView() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    apiGet<MeResponse>("/api/auth/me").then(setMe).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const upgrade = async (interval: "monthly" | "yearly") => {
    setBusy(interval);
    try {
      await apiPost("/api/billing", { action: "upgrade", interval });
      await load();
      window.dispatchEvent(new Event("easynote:refresh-sidebar"));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not update your plan.");
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    if (!confirm("Downgrade to the Starter plan?")) return;
    setBusy("cancel");
    try {
      await apiPost("/api/billing", { action: "cancel" });
      await load();
      window.dispatchEvent(new Event("easynote:refresh-sidebar"));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not update your plan.");
    } finally {
      setBusy(null);
    }
  };

  const chooseModel = async (modelId: string) => {
    setBusy(`model:${modelId}`);
    try {
      await apiPost("/api/settings/model", { modelId });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not switch model.");
    } finally {
      setBusy(null);
    }
  };

  const logoutEverywhere = async () => {
    try {
      await apiPost("/api/auth/logout");
    } catch {
      /* clear client state regardless */
    }
    router.push("/home");
    router.refresh();
  };

  if (!me?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <div className="h-40 animate-pulse rounded-lg bg-surface-2" />
      </div>
    );
  }

  const { user, quota, capabilities } = me;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-2xl font-extrabold text-ink">Settings</h1>

      {/* profile */}
      <section className="mt-6 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-display font-bold text-ink">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-ink">{user.name}</div>
            <div className="text-sm text-muted">{user.email}</div>
            <div className="mt-0.5 text-xs text-muted">
              Member since {new Date(user.createdAt).toLocaleDateString()}
              {user.guest && " · guest account"}
            </div>
          </div>
        </div>
        {user.guest && (
          <p className="mt-4 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm text-ink">
            You&apos;re on a guest account — notes are tied to this browser
            session. Create a real account from the login page to keep them
            long-term.
          </p>
        )}
      </section>

      {/* plan */}
      <section className="mt-5 rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-ink">Plan & usage</h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              user.plan === "pro"
                ? "bg-primary text-primary-ink"
                : "bg-surface-2 text-muted"
            }`}
          >
            {user.plan === "pro" && <Crown size={12} />}
            {user.plan === "pro" ? "Pro" : "Starter"}
            {user.plan === "pro" && user.planInterval
              ? ` · ${user.planInterval}`
              : ""}
          </span>
        </div>

        {quota && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <UsageBar
              label="AI notes this month"
              used={quota.notesUsed}
              limit={quota.notesLimit}
            />
            <UsageBar
              label="Chat messages today"
              used={quota.chatUsed}
              limit={quota.chatLimit}
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {user.plan === "free" ? (
            <>
              <Button
                onClick={() => upgrade("yearly")}
                loading={busy === "yearly"}
              >
                <Crown size={15} /> Upgrade — $8.39/mo yearly
              </Button>
              <Button
                variant="secondary"
                onClick={() => upgrade("monthly")}
                loading={busy === "monthly"}
              >
                $19.99 monthly
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={cancel}
              loading={busy === "cancel"}
            >
              Downgrade to Starter
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">
          Demo checkout — plan changes are instant and free in this self-hosted
          build.
        </p>
      </section>

      {/* AI model picker */}
      <section className="mt-5 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-display font-bold text-ink">AI model</h2>
        <p className="mt-1 text-sm text-muted">
          Choose which model powers your notes, flashcards, quizzes, chat and
          translation. Switch anytime — it applies to new generations.
        </p>

        {capabilities?.models && capabilities.models.length > 0 ? (
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {capabilities.models.map((m) => {
              const active = capabilities.activeModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => !active && chooseModel(m.id)}
                  disabled={busy === `model:${m.id}`}
                  className={`rounded-lg border-2 p-4 text-left transition ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">
                      {m.label}
                    </span>
                    {active && (
                      <span className="flex items-center gap-1 text-xs font-bold text-primary">
                        <BadgeCheck size={14} /> Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {m.blurb}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <Tag>Text</Tag>
                    {m.vision ? <Tag>Vision</Tag> : <Tag muted>No image OCR</Tag>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm text-ink">
            No AI model is configured. Set <code>ANTHROPIC_API_KEY</code>,{" "}
            <code>ZHIPU_API_KEY</code> or <code>MINIMAX_API_KEY</code> (or an{" "}
            <code>AI_BASE_URL</code> provider) and restart the server.
          </div>
        )}
      </section>

      {/* AI capabilities */}
      <section className="mt-5 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-display font-bold text-ink">AI services</h2>
        <p className="mt-1 text-sm text-muted">
          Configured by the server operator via environment variables.
        </p>
        <div className="mt-4 space-y-3">
          <ServiceRow
            ok={Boolean(capabilities?.vision)}
            icon={<KeyRound size={16} />}
            title="Vision (read text from images)"
            detail={
              capabilities?.vision
                ? "A vision-capable model is available — image notes work."
                : "Your selected model can't read images. Pick one tagged “Vision”."
            }
          />
          <ServiceRow
            ok={Boolean(capabilities?.stt)}
            icon={<Server size={16} />}
            title="Speech-to-text for uploaded audio/video"
            detail={
              capabilities?.stt
                ? "Transcription endpoint configured."
                : "Optional: set OPENAI_API_KEY (or STT_API_KEY + STT_BASE_URL). Live recording works without it."
            }
          />
        </div>
      </section>

      {/* session */}
      <section className="mt-5 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-display font-bold text-ink">Session</h2>
        <div className="mt-4">
          <Button variant="secondary" onClick={logoutEverywhere}>
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const pct = Math.min(100, (used / Math.max(1, limit)) * 100);
  return (
    <div className="rounded-lg bg-surface-2 p-4">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-muted">{label}</span>
        <span className="font-semibold text-ink">
          {used}
          <span className="text-muted"> / {limit}</span>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Tag({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        muted ? "bg-surface-2 text-muted" : "bg-primary/10 text-primary"
      }`}
    >
      {children}
    </span>
  );
}

function ServiceRow({
  ok,
  icon,
  title,
  detail,
}: {
  ok: boolean;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-accent/40 bg-accent/10"}`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ok ? "bg-emerald-500/15 text-emerald-600" : "bg-accent/15 text-accent"}`}
      >
        {ok ? <BadgeCheck size={16} /> : icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="mt-0.5 text-xs leading-5 text-muted">{detail}</div>
      </div>
    </div>
  );
}
