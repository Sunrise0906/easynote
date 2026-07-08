# Recall — Design System

Read this before touching any UI. Every component uses **semantic tokens**, never
raw colors or hard-coded hex/oklch. Four themes reassign the tokens; markup and
classes stay identical across themes.

## Tokens (CSS custom properties)

Set on `:root` and overridden per `[data-theme]`. Consumed via Tailwind v4
`@theme inline` as `bg-bg`, `text-ink`, `bg-primary`, `border-border`, etc.

| Token | Role |
|---|---|
| `--bg` | page background |
| `--surface` | cards, panels, raised sections (bg nudged toward ink) |
| `--surface-2` | inputs, nested wells |
| `--ink` | body + heading text (≥7:1 on bg) |
| `--muted` | secondary text (≥4.5:1 on bg) |
| `--faint` | hairline dividers, disabled |
| `--border` | 1px borders |
| `--primary` | the one brand color; fills the primary button/marks |
| `--primary-ink` | text/icon on `--primary` (≥4.5:1) |
| `--accent` | second brand color: links, pills, active states |
| `--accent-ink` | text on `--accent` |
| `--ring` | focus ring (accent at ~40% or a lighter primary) |

Fonts (per theme): `--font-display` (headings), `--font-body`, `--font-mono`.

## Theme palettes (OKLCH, authored — do not "improve" arbitrarily)

**swiss** (default) — pure white, precise, one saturated block
- bg `oklch(1 0 0)` · surface `oklch(0.975 0 0)` · surface-2 `oklch(0.96 0 0)`
- ink `oklch(0.20 0.012 256)` · muted `oklch(0.52 0.01 256)` · faint `oklch(0.90 0.005 256)` · border `oklch(0.90 0.005 256)`
- primary `oklch(0.52 0.15 256)` (cobalt) · primary-ink `oklch(0.99 0 0)`
- accent `oklch(0.55 0.16 28)` (warm red-clay) · accent-ink `oklch(0.99 0 0)`
- display **Space Grotesk**, body **Inter**, mono **JetBrains Mono**

**midnight** — nocturnal ink-blue, cobalt + brass
- bg `oklch(0.17 0.02 264)` · surface `oklch(0.215 0.022 264)` · surface-2 `oklch(0.25 0.024 264)`
- ink `oklch(0.94 0.006 264)` · muted `oklch(0.70 0.015 264)` · faint `oklch(0.32 0.02 264)` · border `oklch(0.30 0.02 264)`
- primary `oklch(0.70 0.13 256)` (lifted cobalt, readable on dark) · primary-ink `oklch(0.16 0.02 264)`
- accent `oklch(0.80 0.11 85)` (brass) · accent-ink `oklch(0.18 0.02 85)`
- display **Space Grotesk**, body **Inter**, mono **JetBrains Mono**

**editorial** — paper white, serif display, oxblood
- bg `oklch(0.985 0.003 95)` · surface `oklch(0.965 0.004 95)` · surface-2 `oklch(0.95 0.005 95)`
- ink `oklch(0.24 0.02 40)` · muted `oklch(0.50 0.02 40)` · faint `oklch(0.89 0.008 60)` · border `oklch(0.87 0.01 60)`
- primary `oklch(0.42 0.13 25)` (oxblood) · primary-ink `oklch(0.98 0.006 90)`
- accent `oklch(0.46 0.10 250)` (slate blue) · accent-ink `oklch(0.98 0 0)`
- display **Fraunces** (serif), body **Inter**, mono **JetBrains Mono**

**botanic** — white, deep moss, sage
- bg `oklch(0.99 0.004 140)` · surface `oklch(0.97 0.006 140)` · surface-2 `oklch(0.955 0.008 140)`
- ink `oklch(0.24 0.02 150)` · muted `oklch(0.48 0.02 150)` · faint `oklch(0.90 0.01 150)` · border `oklch(0.88 0.012 150)`
- primary `oklch(0.42 0.09 150)` (deep moss) · primary-ink `oklch(0.98 0.01 140)`
- accent `oklch(0.62 0.12 145)` (sage/leaf) · accent-ink `oklch(0.18 0.02 150)`
- display **Space Grotesk**, body **Inter**, mono **JetBrains Mono**

## Type rules
- Display uses `--font-display`, weight 600–700, `letter-spacing:-0.02em` (min -0.04em), `text-wrap:balance` on h1–h3.
- Hero clamp max ≤ 5rem. Body 15–16px, line-length ≤ 72ch, `text-wrap:pretty`.
- Serif (editorial) only for display; body stays Inter for legibility.

## Shape & space
- Radius scale: `--r-sm:6px --r-md:10px --r-lg:16px --r-xl:22px`. Editorial trims radii (sharper); botanic slightly rounder. Expose via tokens if it helps, else default md.
- Border default 1px `--border`. Elevation by surface tone + a soft shadow token, not heavy drop shadows.
- Vary section rhythm; do not stamp the same vertical padding everywhere.

## Motion
- ease-out-expo/quint; 150–400ms. Respect `prefers-reduced-motion`. Stagger lists, don't gate content visibility on transitions.

## Absolute bans (from impeccable — match-and-refuse)
- No gradient text (`background-clip:text`). Emphasis via weight/size/color.
- No side-stripe borders (colored `border-left` accents).
- No glassmorphism by default. No hero-metric template. No identical icon-tile card grids.
- No tiny uppercase tracked eyebrow above every section; no `01/02/03` numbered eyebrows unless the section IS a real sequence.
- No purple→blue gradients anywhere (that's the old EasyNote tell we're killing).
- Never hard-code a color in a component — always a token.

## Slop test
If someone could say "an AI made this from the 'AI note app' prompt", it failed.
The switchable-theme system and the per-theme display face are the identity;
lean on them.
