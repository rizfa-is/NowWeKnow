# NowWeKnow — Product Requirements (v2)

> Status: Draft · Owner: Engineering · Last updated: 2026-05-22
>
> Pivot from scrollytelling science explainer to **digital coding worksheets for young learners** with voice-first interaction.

## 1. Vision

A library of **digital coding worksheets for young learners** (PAUD/TK and SD), built for **Interactive Flat Panels** (IFP) in classrooms, where children solve problems by **speaking** as much as by tapping.

Tagline candidate: _Coding worksheets that listen back._

## 2. Why this exists

Three observations from the BA insight:

1. **Coding worksheets are still print-first.** Teachers print PDFs from Canva. Inefficient, not reusable, not interactive.
2. **Digital alternatives are gamified templates** (Super Mario clones) that teachers must manually edit per lesson. High effort, low fit.
3. **Touch-only UX is starving verbal development.** Kids tap and swipe through everything. They understand the material but can't articulate it. Verbal expression isn't being trained.

**Our wedge**: digital worksheets that are (a) zero-prep for teachers, (b) curriculum-shaped not game-shaped, (c) voice-interactive by default with touch as fallback.

## 3. Target users

| Role               | Context                                  | Needs                                                                  |
| ------------------ | ---------------------------------------- | ---------------------------------------------------------------------- |
| **Student (3–6)**  | PAUD/TK, on classroom IFP with teacher   | Big visuals, short voice prompts, immediate feedback, low reading load |
| **Student (7–12)** | SD, IFP or tablet, sometimes solo        | Multi-step problems, narration of reasoning, save progress             |
| **Teacher**        | Runs the IFP, picks the worksheet        | Pick-and-play, no editing, see who answered                            |
| **Parent** _(later)_ | Home use on tablet/phone               | Track progress, pick age-appropriate sheets                            |

**Primary device**: IFP (large touchscreen, ChromeOS/Android/Windows). Web app, fullscreen browser.

## 4. Core principles

- **Voice-first, touch-equal.** Every interaction must be solvable by voice OR touch. Never voice-only (mic might fail, classroom can be noisy).
- **Self-explanatory.** A child should figure out what to do in under 5 seconds without the teacher reading instructions.
- **No login for kids.** Teacher picks the worksheet. Kid just plays.
- **One concept per worksheet.** Don't combine sequencing, loops, and conditionals on the same sheet.
- **Fail soft.** Wrong answer leads to encouraging hint, never red-X shame.

## 5. Coding concepts to worksheet types

### PAUD/TK (3–6)

1. **Color and shape recognition** — _"Say the color of this circle"_
2. **Sequencing** — drag/drop or voice-call items in order ("first apple, then banana")
3. **Pattern completion** — what comes next: 🔴🔵🔴🔵❓
4. **Simple instructions** — "Move the bunny RIGHT three times" (voice or arrow tap)
5. **Matching** — match the word to the picture by saying it

### SD low (Grade 1–3)

6. **Step-by-step paths** — guide a character through a maze using voice commands ("forward", "turn left", "jump")
7. **Sorting and categorization** — group items, explain _why_ by voice
8. **Counting and basic math via voice** — "How many apples? Say the number"
9. **Story sequencing** — order panels, narrate the story

### SD high (Grade 4–6)

10. **Block-style logic** — drag blocks to make a character act, **narrate the plan first** before running
11. **Loop intuition** — "How many times do we repeat?" voice answer plus visual confirm
12. **Conditional thinking** — "IF it rains, THEN..." complete by voice
13. **Debugging** — find what's wrong in a sequence, explain the fix verbally

**MVP coverage** (5 worksheets):

- Color recognition (PAUD) — proves the voice loop
- Sequence the fruits (PAUD) — proves drag + voice
- Move the bunny (PAUD) — proves directional commands
- Bunny path maze (SD low) — proves multi-step voice plans
- Loop the dance (SD high) — proves loop intuition with narration

## 6. Voice interaction spec

Implementation: **Web Speech API** (`SpeechRecognition`) via `useSpeechRecognition` from VueUse.

### Commands by category

| Category   | English                                       | Bahasa Indonesia                            |
| ---------- | --------------------------------------------- | ------------------------------------------- |
| Navigation | "next", "back", "repeat"                      | "lanjut", "kembali", "ulang"                |
| Actions    | "start", "stop", "submit"                     | "mulai", "berhenti", "kirim"                |
| Movement   | "up/down/left/right", "forward"               | "atas/bawah/kiri/kanan", "maju"             |
| Answers    | colors, numbers 0–20, animal/object names     | colors, numbers, common nouns               |

### Recognition rules

- **Confidence threshold**: 0.6. Below leads to "Can you say it again?"
- **Listening window**: 4 seconds max per prompt, visualized with a pulsing mic ring
- **Wake state**: tap mic OR say _"hello"_ / _"halo"_ to start listening (no always-on)
- **Fallback**: every voice prompt has a touch equivalent visible at all times

### Accessibility and failure modes

- **No mic permission** — fully touch-playable, no degraded experience
- **Noisy classroom** — mic auto-mutes after 2 misrecognitions, switches to touch
- **Locale switching** — start with `id-ID` and `en-US`, configurable per worksheet

### Privacy

- Voice processing in-browser (Web Speech API uses Google or Apple cloud STT under the hood — disclose in privacy notice)
- **No audio recording stored.** Transcripts only, in-memory, discarded after each problem.

## 7. Tech approach

Keep what works, drop what doesn't.

### Keep

- **Nuxt 4** — solid SSR, file routing, good DX
- **Nuxt Content** — worksheets as markdown/YAML is teacher-friendlier than code
- **Motion-V** — animations now serve interaction feedback, not parallax
- **VueUse** — `useSpeechRecognition`, `useSpeechSynthesis`, `useFullscreen`, `useIdle`

### Drop

- Scrollytelling parallax (`ParallaxSky.vue`, `ChapterPanel.vue`, `ChapterSkyBlue.vue`)
- The "Why is the sky blue?" chapter content
- Loader for hero (replace with a teacher-friendly worksheet picker)

### Add

- `useVoice()` composable wrapping VueUse `useSpeechRecognition` with normalization, locale switching, retry logic
- `WorksheetShell.vue` — fullscreen container, progress dots, mic indicator, hint button, locale toggle
- One component per worksheet type (`<ColorWorksheet>`, `<SequenceWorksheet>`, `<MoveWorksheet>`, `<MazeWorksheet>`, `<LoopWorksheet>`)
- Worksheet metadata schema in `content.config.ts`

### Tech to evaluate later

- **Howler/Tone.js** for audio cues (chime on correct, soft thud on wrong)
- **localStorage** for "stars earned" progress
- **PWA / offline** for spotty school wifi (matters for IFP reality)

## 8. Information architecture

```
/ ............... Worksheet picker (teacher view: filter by age, concept)
/play/:slug ..... Fullscreen worksheet runner
/about .......... For teachers and parents (id and en)
```

Content structure:

```
content/
  worksheets/
    paud/
      colors-of-the-rainbow.md
      sequence-the-fruits.md
      move-the-bunny.md
    sd-low/
      bunny-path-maze.md
    sd-high/
      loop-the-dance.md
```

Each worksheet's frontmatter declares: `type`, `ageBand`, `concept`, `locales`, `voiceCommands`, plus type-specific data.

## 9. Out of scope (MVP)

- User accounts, classes, multi-student saved progress
- Teacher dashboard with analytics
- Authoring UI (teachers edit markdown for now; that's still better than print)
- Multiplayer / classroom-mode where 30 kids each speak
- Translation beyond `id-ID` and `en-US`

## 10. Success metrics

- Teacher picks and runs a worksheet in **under 30 seconds** (first-use)
- **80%+** of voice answers recognized on first try in a quiet room
- **Zero** worksheets that block progress when mic is off
- Kid completes a 5-prompt worksheet **without adult help** (PAUD = with prompting OK)

## 11. Phase plan

| Phase                   | Scope                                                         | Deliverable                              |
| ----------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| **0 – Cleanup**         | Strip scrollytelling code                                     | Empty Nuxt shell with new IA             |
| **1 – Foundation**      | `useVoice()`, `WorksheetShell`, picker page, content schema   | One demo worksheet works end-to-end      |
| **2 – Worksheet types** | 4 more worksheet types covering PAUD–SD high                  | 5 playable worksheets, both locales      |
| **3 – Polish**          | Audio cues, animations, accessibility pass                    | Teacher-test-ready build                 |
| **4 – Field test**      | Try in a real classroom                                       | Bug fixes plus iteration                 |

## 12. Risks

| Risk                                                       | Mitigation                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Web Speech API support uneven across browsers              | Detect on load, show clear fallback UI; document Chrome/Edge as primary   |
| Indonesian recognition accuracy for child voices is poor   | Allow short answers and number words; provide tap fallback always         |
| IFP browser may not grant mic permission by default        | Provide "tap to enable mic" first-run gate; persist choice in storage     |
| Teachers find markdown authoring intimidating              | Ship with 5 ready worksheets; authoring UI is a Phase 5 problem           |
| Classroom noise breaks recognition                         | Confidence threshold + auto-fallback to touch after 2 misses              |
