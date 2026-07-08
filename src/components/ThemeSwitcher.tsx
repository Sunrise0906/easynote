"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import {
  DEFAULT_THEME,
  THEMES,
  THEME_META,
  THEME_STORAGE_KEY,
  ThemeId,
} from "@/lib/theme";

function applyTheme(t: ThemeId) {
  document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, t);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("recall:theme", { detail: t }));
}

export function useTheme(): [ThemeId, (t: ThemeId) => void] {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  useEffect(() => {
    const cur = (document.documentElement.getAttribute("data-theme") ||
      DEFAULT_THEME) as ThemeId;
    setThemeState(cur);
    const onChange = (e: Event) =>
      setThemeState((e as CustomEvent).detail as ThemeId);
    window.addEventListener("recall:theme", onChange);
    return () => window.removeEventListener("recall:theme", onChange);
  }, []);
  const set = (t: ThemeId) => {
    applyTheme(t);
    setThemeState(t);
  };
  return [theme, set];
}

export default function ThemeSwitcher({
  align = "right",
}: {
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:border-ink/30"
        aria-label="Change theme"
        aria-expanded={open}
      >
        <Palette size={16} className="text-muted" />
        <span className="hidden sm:inline">{THEME_META[theme].label}</span>
        <span className="flex gap-0.5">
          {THEME_META[theme].swatch.slice(2).map((c, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-full ring-1 ring-black/10"
              style={{ background: c }}
            />
          ))}
        </span>
      </button>

      {open && (
        <div
          className={`absolute top-12 z-50 w-64 overflow-hidden rounded-lg border border-border bg-surface p-1.5 shadow-[var(--shadow-soft)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Theme
          </div>
          {THEMES.map((t) => {
            const meta = THEME_META[t];
            const active = t === theme;
            return (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition ${
                  active ? "bg-surface-2" : "hover:bg-surface-2"
                }`}
              >
                <span className="flex shrink-0 overflow-hidden rounded-md ring-1 ring-black/10">
                  {meta.swatch.map((c, i) => (
                    <span
                      key={i}
                      className="h-7 w-3.5"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    {meta.label}
                    {active && <Check size={13} className="text-accent" />}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {meta.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
