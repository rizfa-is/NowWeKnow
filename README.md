# NowWeKnow

Immersive scrollytelling explainers for everyday science. Inspired by Getty's *Persepolis Reimagined*.

First chapter: **Why is the sky blue?**

## Stack

- Nuxt 4 + Nuxt Content (chapter copy as markdown)
- Motion-V for scroll-linked parallax animations
- VueUse for scroll/mouse reactivity
- CSS-driven 3D parallax (cheap, fast, no WebGL needed)

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Add a chapter

Drop a markdown file in `content/chapters/` with frontmatter:

```md
---
title: "Why does ice float?"
order: 2
kicker: "Density"
summary: "Solid water is lighter than liquid water — and life depends on it."
accent: "#9ad9ff"
---
```
