export const THEMES = ["swiss", "midnight", "editorial", "botanic"] as const;
export type ThemeId = (typeof THEMES)[number];

export const THEME_META: Record<
  ThemeId,
  { label: string; blurb: string; swatch: string[] }
> = {
  swiss: {
    label: "Swiss",
    blurb: "Pure white, precise, one cobalt block.",
    // preview swatches (bg, ink, primary, accent) — display only
    swatch: ["#ffffff", "#22262e", "#3a5ccc", "#c0472f"],
  },
  midnight: {
    label: "Midnight",
    blurb: "Nocturnal ink-blue with cobalt & brass.",
    swatch: ["#15181f", "#e9ecf2", "#7d9bf0", "#d8b26a"],
  },
  editorial: {
    label: "Editorial",
    blurb: "Paper, serif display, oxblood.",
    swatch: ["#faf9f5", "#2b2723", "#8a2f2a", "#3f5170"],
  },
  botanic: {
    label: "Botanic",
    blurb: "White, deep moss, sage.",
    swatch: ["#fbfdfb", "#242e28", "#2f6a4a", "#5fa77e"],
  },
};

export const DEFAULT_THEME: ThemeId = "swiss";
export const THEME_STORAGE_KEY = "recall-theme";

/**
 * Inline, render-blocking script that applies the saved theme before paint so
 * there is no flash of the wrong theme. Kept dependency-free and tiny.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});var v=${JSON.stringify(
  THEMES
)};if(!v.indexOf||v.indexOf(t)===-1){t=${JSON.stringify(
  DEFAULT_THEME
)};}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme',${JSON.stringify(
  DEFAULT_THEME
)});}})();`;
