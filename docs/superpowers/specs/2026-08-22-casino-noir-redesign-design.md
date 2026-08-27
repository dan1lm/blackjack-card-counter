# HiLoMaster — Casino Noir Redesign

Date: 2026-08-22

## Goal

Full rewrite of the UI/UX for the Hi-Lo card-counting trainer, moving away from the current boxy/templated dashboard look toward a custom, restrained "casino noir" aesthetic executed with premium-product-level craft (Linear/Stripe/Vercel-adjacent polish). Same feature set as today, with the bugs found in the prior code review fixed as part of the rewrite.

## Non-goals

- No new features (counting systems, streaks/history, accounts, etc.) — same functionality: self-paced / timed modes, deck size 10–312, running-count entry, results screen.
- No test framework beyond a small, targeted Vitest suite (see Testing).

## Visual system

**Palette**
- Background (felt): `#0a0f0c` → `#0d1310`
- Primary ink (text): `#e8e4d8`
- Secondary/dim text: `#8a9389`
- Accent (gold): `#c9a84c` — used sparingly: active states, borders, CTA, positive count values
- Red pip accent: `#8a1c1c` — hearts/diamonds, negative count values
- Hairline dividers: `rgba(232,228,216,0.14)`

**Typography**
- Display/headings/wordmark: serif (Fraunces or Playfair Display), self-hosted via `@fontsource` (no runtime Google Fonts fetch — offline-safe, no CSP/network dependency at runtime).
- Numerals (running count, timer, accuracy, deck size, card index): monospace (JetBrains Mono or IBM Plex Mono), tabular figures.
- Body copy: system sans stack.

**Structure**
- No bordered card-grid dashboard panels. Regions separated by 1px hairline rules, not boxes/shadows.
- Asymmetric two-column layout on desktop (settings rail + practice stage), generous negative space.
- One card as the visual focal point of the practice stage.

**Motion**
- Card reveal: short flip/slide transition.
- Correct/incorrect feedback: brief gold/red edge-flash on the card itself, not a separate banner-style color swap.
- Timed mode: thin 1px depleting progress line under the card, replacing the boxed countdown display.
- All transitions 150–250ms, ease-out. No bounce/decorative animation.

## Card rendering

Cards are custom-built SVG/CSS components (serif rank glyph + drawn suit pip) covering all 52 ranks/suits plus the card back — no image assets. This retires:
- `public/cards/*.png` (currently used, replaced by custom rendering)
- `public/SVG-cards-1.3/*` (already unused, delete)
- `src/assets/card-back-1.jpg`, `card-back-2.png`, `card-back-3.png` (replace with a custom-drawn back design; delete files)

## Component architecture

- **`App.jsx`** — top-level state machine (`idle → running → results`), same responsibility as today, no logic changes beyond prop cleanup.
- **`useCardCounting` hook** — bug fix: shuffle the fully-built deck *before* slicing to `deckSize`, so any `deckSize` < a multiple of 52 is a genuine random sample rather than a deterministic ordered prefix (hearts-first every time, as it is today).
- **Practice stage (`Deck.jsx` → split)**:
  - New `useCountdown` hook owns the timed-mode countdown/timer logic in one place, always reading current `mode`/`targetRate` rather than values closed over at mount.
  - All pending `setTimeout`s (post-answer delay, incorrect-retry delay, time's-up delay) tracked in a ref array and cleared together on stop/unmount, fixing the current setState-after-unmount risk.
  - `finishSimulation` stops relying on stale render-closure values for `correctCount`/`incorrectCount`/`cardTimes` (the bug that undercounts results when the deck finishes on a correct final card) — state read via refs kept in sync each render, or the completion path restructured so the closure is always current.
  - Drop the unused `stopSimulation` prop pass-through and other dead vars flagged by ESLint (`currentCount`/`setCurrentCount`, `intervalRef`, unused `getCardValue` destructure).
- **`PlayingCard`** (replaces `Card.jsx`) — renders a card from `{ rank, suit }`, owns flip animation and correct/incorrect flash.
- **`SettingsPanel`** (replaces `Settings.jsx`) — restyled: underline mode switch, hairline fields, single CTA. Same props/logic as today.
- **`ResultsView`** (replaces `Results.jsx`) — same data shape, restyled: grade + stats in the hairline/monospace language; response-time chart redrawn as a minimal chart in the new palette (still built from `cardTimes`, no data changes).
- **Styling**: one `theme.css` holding color/spacing/type-scale tokens (CSS custom properties), imported once; per-component CSS files trimmed to layout-only rules that reference the tokens instead of duplicating raw values.

## Responsive strategy

Single breakpoint (~640px):
- **Above**: asymmetric two-column layout (settings rail + practice stage), as approved in the desktop mockup.
- **Below**: single-column, full-screen practice stage (card + input primary), settings collapse into a `<details>`-style drawer above the stage, as approved in the mobile mockup.
- Fluid type/spacing via `clamp()` rather than a large breakpoint matrix.

## Bugs fixed as part of this rewrite

1. **Deck sampling bug** (`useCardCounting.jsx`) — slice-before-shuffle meant any non-multiple-of-52 deck size always drew the same deterministic subset of cards. Fixed by shuffling before slicing.
2. **Stale-closure results undercount** (`Deck.jsx`) — `finishSimulation`, reached via a chain of `setTimeout`s, closed over pre-increment `correctCount`/`incorrectCount`/`cardTimes`, undercounting the final card's result. Fixed by restructuring state access to avoid the stale closure.
3. **Dangling timers** (`Deck.jsx`) — pending `setTimeout`s from the answer-feedback and countdown flows weren't tracked/cleared on stop or unmount. Fixed by tracking all timer IDs in a ref and clearing them together.
4. **Dead code** — unused `stopSimulation` prop, `currentCount`/`setCurrentCount`, `intervalRef`, unused `getCardValue` destructure — removed. `npx eslint .` should report zero problems after the rewrite.
5. **Unused assets** — `public/SVG-cards-1.3/*` and unused `card-back` images removed (superseded by custom-drawn cards regardless).

## Testing

No test framework exists today. Add a minimal Vitest setup covering only the logic that actually broke before:
- `useCardCounting`: deck size/composition correctness, and that partial decks are genuinely randomly sampled (not a deterministic prefix) across multiple runs.
- Hi-Lo scoring logic: value mapping (2–6 → +1, 7–9 → 0, 10–A → −1) and running-count accumulation.

No UI/component test coverage — this is a solo hobby project; manual in-browser verification (desktop + mobile viewport) covers the rest, including confirming the timer/results fixes hold up when a session completes on a correct final card.

## Out of scope / explicitly not changing

- Deployment target (Vercel), build tooling (Vite), Tailwind presence (currently installed but unused by hand-written CSS — will stay unused unless it turns out useful during implementation; not a goal to adopt it).
- Footer links/content, favicon, page `<title>`.
