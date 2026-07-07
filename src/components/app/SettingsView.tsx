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
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
    );
  }

  const { user, quota, capabilities } = me;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>

      {/* profile */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-slate-900">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{user.name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
            <div className="mt-0.5 text-xs text-slate-400">
              Member since {new Date(user.createdAt).toLocaleDateString()}
              {user.guest && " · guest account"}
            </div>
          </div>
        </div>
        {user.guest && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            You&apos;re on a guest account — notes are tied to this browser
            session. Create a real account from the login page to keep them
            long-term.
          </p>
        )}
      </section>

      {/* plan */}
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Plan & usage</h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              user.plan === "pro"
                ? "bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white"
                : "bg-slate-100 text-slate-600"
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
        <p className="mt-3 text-xs text-slate-400">
          Demo checkout — plan changes are instant and free in this self-hosted
          build.
        </p>
      </section>

      {/* AI configuration */}
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-slate-900">AI services</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configured by the server operator via <code>.env.local</code>.
        </p>
        <div className="mt-4 space-y-3">
          <ServiceRow
            ok={Boolean(capabilities?.ai)}
            icon={<KeyRound size={16} />}
            title="Text AI (notes, flashcards, quiz, chat, translation)"
            detail={
              capabilities?.ai
                ? `Active model: ${capabilities.model || "configured"} (${capabilities.provider === "openai" ? "OpenAI-compatible provider" : "Anthropic Claude"}).`
                : "Set ANTHROPIC_API_KEY, or an AI_PROVIDER=openai config, and restart."
            }
          />
          <ServiceRow
            ok={Boolean(capabilities?.vision)}
            icon={<KeyRound size={16} />}
            title="Vision (read text from images)"
            detail={
              capabilities?.vision
                ? "A vision-capable model is configured — image notes work."
                : "Set a vision model (Claude, or AI_VISION_MODEL like glm-4.6v / qwen3-vl) to read images."
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
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-slate-900">Session</h2>
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
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">
          {used}
          <span className="text-slate-400"> / {limit}</span>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${pct >= 100 ? "bg-rose-500" : "bg-brand-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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
      className={`flex items-start gap-3 rounded-xl border p-4 ${ok ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/60"}`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
      >
        {ok ? <BadgeCheck size={16} /> : icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="mt-0.5 text-xs leading-5 text-slate-500">{detail}</div>
      </div>
    </div>
  );
}
