# Recall — Product Context

**Recall** turns anything you hear, watch or read — lectures, meetings, YouTube,
PDFs, images, voice — into structured notes, flashcards, quizzes, mind maps and a
chat tutor. (Formerly "EasyNote"; renamed and redesigned.)

- **Register:** hybrid. Marketing pages are **brand** (design is the product);
  the note app is **product** (design serves the work).
- **Audience:** students and knowledge workers who take in a lot and want to
  actually retain it. Design-literate, on laptops and phones, often at night.
- **Voice:** calm, exact, a little literary. Confident without hype. Never
  "supercharge your productivity". We talk about *understanding* and *memory*,
  not "AI-powered synergy".
- **Anti-references (what we refuse to look like):** the purple→blue SaaS
  gradient template; Inter-for-everything; icon-tile-above-every-heading; three
  identical feature cards; hero-metric rows. The old EasyNote look is the thing
  we are explicitly leaving behind.

## Signature idea: switchable themes

Recall ships **four first-class visual themes** the user picks in-app and on the
marketing site. They are not light/dark toggles of one look — each is a distinct
design language sharing one layout and type *structure* but its own palette and
display face. This is a real product feature, surfaced prominently.

| Theme id | Name | Feel |
|---|---|---|
| `swiss` | Swiss | pure-white, near-black grotesk, one cobalt block. Precise, default. |
| `midnight` | Midnight | deep ink-blue near-black, cobalt + brass. Focused, nocturnal. |
| `editorial` | Editorial | paper-white, Fraunces serif display, oxblood accent. Magazine. |
| `botanic` | Botanic | white, deep moss green, sage accent. Calm, organic. |

The design system is **semantic tokens**: every component references role tokens
(`--bg`, `--ink`, `--primary`…), never a raw color. Switching theme reassigns the
tokens; components never change.
