---
title:
  en: "Loop the dance"
  id: "Loop tarian"
type: loop
ageBand: sd-high
concept: "loop intuition"
order: 1
locales: [en, id]
accent: "#9b5de5"
data:
  moves:
    - id: clap
      emoji: "👏"
      name:
        en: clap
        id: tepuk
    - id: jump
      emoji: "⬆️"
      name:
        en: jump
        id: lompat
    - id: spin
      emoji: "🌀"
      name:
        en: spin
        id: putar
    - id: stomp
      emoji: "👣"
      name:
        en: stomp
        id: hentak
    - id: wave
      emoji: "👋"
      name:
        en: wave
        id: lambai
  prompts:
    - pattern: ["clap", "jump"]
      times: 3
    - pattern: ["spin", "clap", "stomp"]
      times: 2
    - pattern: ["wave", "wave", "jump", "clap"]
      times: 3
---

Build a loop body and choose how many times it repeats. Children narrate
their plan ("clap, jump, repeat 3 times") before running it. The expanded
preview shows what the loop unfolds into so the abstraction stays visible.
