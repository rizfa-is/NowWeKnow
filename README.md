# NowWeKnow

Voice-first digital coding worksheets for young learners (PAUD/TK and SD).
Built for Interactive Flat Panels in classrooms.

> **Pivot in progress.** Earlier scrollytelling concept is archived.
> See `docs/PRD.md` for product direction.

## What it is

A library of bite-sized coding worksheets where children solve problems by
**speaking** as much as by tapping. The goal: bring back verbal expression
to digital learning.

## Stack

- Nuxt 4 + Nuxt Content (worksheets as markdown)
- VueUse `useSpeechRecognition` (Web Speech API)
- Motion-V for interaction feedback
- CSS-only animations where possible (no WebGL needed)

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Add a worksheet

Drop a markdown file in `content/worksheets/<ageBand>/<slug>.md`:

```md
---
title:
  en: "Colors of the rainbow"
  id: "Warna pelangi"
type: color
ageBand: paud
concept: "color recognition"
order: 1
locales: [en, id]
data:
  prompts:
    - color: red
      target:
        en: red
        id: merah
---
```

See `content.config.ts` for the full schema and `app/components/worksheets/`
for available worksheet types.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run typecheck` — TypeScript check
