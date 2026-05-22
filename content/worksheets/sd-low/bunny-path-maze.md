---
title:
  en: "Bunny path maze"
  id: "Labirin kelinci"
type: maze
ageBand: sd-low
concept: "multi-step planning"
order: 1
locales: [en, id]
accent: "#118ab2"
data:
  levels:
    - cols: 4
      rows: 3
      start: [0, 0]
      goal: [3, 2]
      walls:
        - [1, 1]
    - cols: 5
      rows: 4
      start: [0, 0]
      goal: [4, 3]
      walls:
        - [2, 0]
        - [2, 1]
        - [1, 3]
    - cols: 6
      rows: 5
      start: [0, 4]
      goal: [5, 0]
      walls:
        - [2, 4]
        - [2, 3]
        - [3, 1]
        - [3, 2]
        - [4, 4]
---

Plan the whole path before running. Children build a queue of arrows by
voice ("up", "right") or by tapping, then say "go" to watch the bunny
execute their plan. The plan stays visible — they can compare what they
intended to what happened.
