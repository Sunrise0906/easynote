"use client";

import { Check } from "lucide-react";
import { THEMES, THEME_META } from "@/lib/theme";
import { useTheme } from "../ThemeSwitcher";

/**
 * Marketing section that lets a visitor try each theme live — clicking a card
 * reskins the whole site instantly. This IS the product's signature feature,
 * so we demonstrate it rather than describe it.
 */
export default function ThemeShowcase() {
  const [theme, setTheme] = useTheme();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {THEMES.map((t) => {
        const meta = THEME_META[t];
        const active = theme === t;
        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`group overflow-hidden rounded-lg border-2 text-left transition ${
              active
                ? "border-primary"
                : "border-border hover:border-ink/25"
            }`}
          >
            {/* mini preview built from the theme's own swatch colors */}
            <div
              className="relative h-28 p-3"
              style={{ background: meta.swatch[0] }}
            >
              <div
                className="h-2.5 w-16 rounded-full"
                style={{ background: meta.swatch[1], opacity: 0.9 }}
              />
              <div
                className="mt-2 h-2 w-24 rounded-full"
                style={{ background: meta.swatch[1], opacity: 0.35 }}
              />
              <div
                className="mt-1.5 h-2 w-20 rounded-full"
                style={{ background: meta.swatch[1], opacity: 0.35 }}
              />
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                <span
                  className="h-6 w-6 rounded-md"
                  style={{ background: meta.swatch[2] }}
                />
                <span
                  className="h-6 w-6 rounded-md"
                  style={{ background: meta.swatch[3] }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border bg-surface px-3.5 py-3">
              <div>
                <div className="font-display text-sm font-semibold text-ink">
                  {meta.label}
                </div>
                <div className="text-xs text-muted">{meta.blurb}</div>
              </div>
              {active && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-ink">
                  <Check size={12} />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
