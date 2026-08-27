# Casino Noir Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the HiLoMaster UI from the current boxy/templated dashboard look to a custom "casino noir" design (hairline dividers, serif/monospace typography, custom-drawn cards), fixing the three bugs found in code review along the way, with the same feature set as today.

**Architecture:** Pure game logic (deck building, shuffling, Hi-Lo scoring) moves into a plain, framework-free module (`src/lib/deck.js`) so it's directly unit-testable. `useCardCounting` becomes a thin React wrapper around it. The practice screen (`Deck.jsx` → `PracticeStage.jsx`) is fixed to track its count/time state in refs (not just React state) so that delayed callbacks (`setTimeout`/`setInterval`) always read current values instead of the render-closure snapshot that caused the results-undercount bug. A new `useCountdown` hook owns the timed-mode countdown in isolation. All components are restyled against a shared `theme.css` token file — no per-component color/spacing literals.

**Tech Stack:** React 19, Vite 6, plain CSS (custom properties), `@fontsource/fraunces` + `@fontsource/jetbrains-mono` (self-hosted webfonts), Vitest for unit tests.

---

## Reference: design tokens

Every task below that touches CSS uses these tokens (defined once in Task 4, referenced everywhere after):

```css
--felt-950: #0a0f0c;
--felt-900: #0d1310;
--ink: #e8e4d8;
--ink-dim: #8a9389;
--gold: #c9a84c;
--red: #8a1c1c;
--line: rgba(232, 228, 216, 0.14);
--font-display: 'Fraunces', Georgia, 'Times New Roman', serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
--font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
--space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
--radius: 8px;
--breakpoint-stack: 640px;
```

---

### Task 1: Add fonts + test tooling

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install @fontsource/fraunces @fontsource/jetbrains-mono
npm install -D vitest
```

- [ ] **Step 2: Add a `test` script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Add a `test` block to Vite config**

`vite.config.js` becomes:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Verify Vitest runs (no tests yet)**

Run: `npm test`
Expected: `No test files found` (exit code non-zero is fine at this point — no test files exist yet). This just confirms Vitest itself is wired up.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.js
git commit -m "chore: add fontsource packages and vitest"
```

---

### Task 2: Pure deck/scoring module + tests (TDD)

This fixes **bug #1** (deck-size sampling): shuffle the full deck before slicing, not after.

**Files:**
- Create: `src/lib/deck.js`
- Test: `src/lib/deck.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/deck.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildDeck, getCardValue, getRunningCountThrough, SUITS, RANKS } from './deck';

describe('buildDeck', () => {
  it('returns exactly deckSize cards for sizes under one deck', () => {
    expect(buildDeck(10)).toHaveLength(10);
    expect(buildDeck(37)).toHaveLength(37);
  });

  it('returns exactly deckSize cards for sizes spanning multiple decks', () => {
    expect(buildDeck(52)).toHaveLength(52);
    expect(buildDeck(104)).toHaveLength(104);
    expect(buildDeck(60)).toHaveLength(60);
    expect(buildDeck(312)).toHaveLength(312);
  });

  it('only produces cards with valid suits and ranks', () => {
    const deck = buildDeck(312);
    for (const card of deck) {
      expect(SUITS).toContain(card.suit);
      expect(RANKS).toContain(card.rank);
    }
  });

  it('does not always draw the same deterministic prefix for partial decks', () => {
    // Before the fix, buildDeck(10) always returned the first 10 cards of an
    // ordered deck (all hearts, 2 through jack) shuffled only among themselves.
    const firstCards = new Set();
    for (let i = 0; i < 30; i++) {
      const deck = buildDeck(10);
      firstCards.add(`${deck[0].rank}-${deck[0].suit}`);
    }
    // With true random sampling, seeing the same first card in all 30 runs is
    // astronomically unlikely; the old bug guaranteed it every single time.
    expect(firstCards.size).toBeGreaterThan(1);
  });

  it('does not draw a partial deck from a single suit only', () => {
    // Before the fix, buildDeck(10) could only ever be hearts (the first
    // suit in SUITS) because the slice happened before the shuffle.
    const deck = buildDeck(10);
    const suitsSeen = new Set(deck.map((card) => card.suit));
    expect(suitsSeen.size).toBeGreaterThan(1);
  });
});

describe('getCardValue', () => {
  it('returns 0 for a missing card', () => {
    expect(getCardValue(null)).toBe(0);
  });

  it('returns +1 for low cards (2-6)', () => {
    for (const rank of ['2', '3', '4', '5', '6']) {
      expect(getCardValue({ rank, suit: 'spades' })).toBe(1);
    }
  });

  it('returns 0 for neutral cards (7-9)', () => {
    for (const rank of ['7', '8', '9']) {
      expect(getCardValue({ rank, suit: 'spades' })).toBe(0);
    }
  });

  it('returns -1 for high cards (10, J, Q, K, A)', () => {
    for (const rank of ['10', 'J', 'Q', 'K', 'A']) {
      expect(getCardValue({ rank, suit: 'spades' })).toBe(-1);
    }
  });
});

describe('getRunningCountThrough', () => {
  it('sums card values for the first N cards', () => {
    const deck = [
      { rank: '2', suit: 'hearts' },  // +1
      { rank: '9', suit: 'hearts' },  // 0
      { rank: 'K', suit: 'hearts' },  // -1
      { rank: '5', suit: 'hearts' },  // +1
    ];
    expect(getRunningCountThrough(deck, 0)).toBe(0);
    expect(getRunningCountThrough(deck, 1)).toBe(1);
    expect(getRunningCountThrough(deck, 3)).toBe(0);
    expect(getRunningCountThrough(deck, 4)).toBe(1);
  });

  it('does not read past the end of the deck', () => {
    const deck = [{ rank: '2', suit: 'hearts' }];
    expect(getRunningCountThrough(deck, 5)).toBe(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './deck'` (file doesn't exist yet).

- [ ] **Step 3: Implement `src/lib/deck.js`**

```js
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const LOW_RANKS = new Set(['2', '3', '4', '5', '6']);
const NEUTRAL_RANKS = new Set(['7', '8', '9']);

export function shuffle(cards) {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function buildDeck(deckSize) {
  const standardDecks = Math.ceil(deckSize / 52);
  const fullDeck = [];

  for (let d = 0; d < standardDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        fullDeck.push({ suit, rank });
      }
    }
  }

  // Shuffle before slicing so a partial deck is a genuine random sample,
  // not always the same ordered prefix (e.g. always hearts 2-10).
  return shuffle(fullDeck).slice(0, deckSize);
}

export function getCardValue(card) {
  if (!card) return 0;
  if (LOW_RANKS.has(card.rank)) return 1;
  if (NEUTRAL_RANKS.has(card.rank)) return 0;
  return -1;
}

export function getRunningCountThrough(deck, upToIndex) {
  let count = 0;
  for (let i = 0; i < upToIndex && i < deck.length; i++) {
    count += getCardValue(deck[i]);
  }
  return count;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests in `src/lib/deck.test.js` green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/deck.js src/lib/deck.test.js
git commit -m "fix: shuffle full deck before slicing to deckSize

Partial decks (deckSize not a multiple of 52) were sliced from the
ordered deck before shuffling, so they always drew the same
deterministic prefix (e.g. hearts 2-10) instead of a random sample."
```

---

### Task 3: Rewrite `useCardCounting` to use the pure module

**Files:**
- Modify: `src/hooks/useCardCounting.jsx`

- [ ] **Step 1: Replace the hook body**

```jsx
import { useState, useEffect } from 'react';
import { buildDeck, getCardValue, getRunningCountThrough } from '../lib/deck';

const useCardCounting = (deckSize = 52) => {
  const [deck, setDeck] = useState([]);

  useEffect(() => {
    setDeck(buildDeck(deckSize));
  }, [deckSize]);

  return {
    deck,
    getCardValue,
    getRunningCountThrough: (upToIndex) => getRunningCountThrough(deck, upToIndex),
  };
};

export default useCardCounting;
```

- [ ] **Step 2: Run existing tests to confirm nothing broke**

Run: `npm test`
Expected: PASS (unchanged — this hook has no direct tests, `deck.js` tests still pass).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCardCounting.jsx
git commit -m "refactor: back useCardCounting with the pure deck module"
```

---

### Task 4: Design tokens, fonts, and asset cleanup

**Files:**
- Create: `src/styles/theme.css`
- Modify: `src/main.jsx`
- Modify: `src/index.css`
- Delete: `public/SVG-cards-1.3/` (entire directory, 43 files)
- Delete: `public/cards/` (entire directory, 57 files)
- Delete: `src/assets/card-back-1.jpg`, `src/assets/card-back-2.png`, `src/assets/card-back-3.png`

- [ ] **Step 1: Create the token file**

`src/styles/theme.css`:

```css
:root {
  --felt-950: #0a0f0c;
  --felt-900: #0d1310;
  --ink: #e8e4d8;
  --ink-dim: #8a9389;
  --gold: #c9a84c;
  --red: #8a1c1c;
  --line: rgba(232, 228, 216, 0.14);

  --font-display: 'Fraunces', Georgia, 'Times New Roman', serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  --radius: 8px;
  --transition: 200ms ease-out;
}
```

- [ ] **Step 2: Wire up fonts and the token file in `main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/fraunces/400.css'
import '@fontsource/fraunces/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './styles/theme.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Rewrite `src/index.css` global reset**

```css
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
}

body {
  background: var(--felt-950);
  color: var(--ink);
  font-family: var(--font-body);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: var(--gold);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  font-family: inherit;
  cursor: pointer;
}

button:focus-visible,
input:focus-visible {
  outline: 1px solid var(--gold);
  outline-offset: 2px;
}

input {
  font-family: inherit;
}
```

- [ ] **Step 4: Delete unused asset directories and files**

```bash
git rm -r public/SVG-cards-1.3 public/cards
git rm src/assets/card-back-1.jpg src/assets/card-back-2.png src/assets/card-back-3.png
```

- [ ] **Step 5: Verify the app still starts (card images will be broken until Task 5, that's expected)**

Run: `npm run dev`
Expected: Vite dev server starts without errors. Stop it (`Ctrl+C`) once confirmed — visual regressions in `Card.jsx`/`Deck.jsx` are expected and fixed in later tasks.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add casino-noir design tokens, self-host fonts, drop unused card art

Card faces move to custom-drawn CSS/SVG in a later task, so the PNG/SVG
asset sets and placeholder card-back images are no longer needed."
```

---

### Task 5: `PlayingCard` component (replaces `Card.jsx`)

**Files:**
- Create: `src/components/PlayingCard.jsx`
- Create: `src/styles/PlayingCard.css`
- Delete: `src/components/Card.jsx`
- Delete: `src/styles/Card.css`

- [ ] **Step 1: Create `PlayingCard.jsx`**

```jsx
import '../styles/PlayingCard.css';

const SUIT_SYMBOL = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

const PlayingCard = ({ card, revealed, flash }) => {
  if (!revealed || !card) {
    return (
      <div className="playing-card playing-card--back" aria-hidden="true">
        <div className="playing-card__back-pattern" />
      </div>
    );
  }

  const { rank, suit } = card;
  const colorClass = RED_SUITS.has(suit) ? 'playing-card--red' : 'playing-card--black';
  const flashClass = flash ? `playing-card--${flash}` : '';

  return (
    <div
      className={`playing-card playing-card--front ${colorClass} ${flashClass}`}
      role="img"
      aria-label={`${rank} of ${suit}`}
    >
      <span className="playing-card__rank playing-card__rank--top">{rank}</span>
      <span className="playing-card__suit">{SUIT_SYMBOL[suit]}</span>
      <span className="playing-card__rank playing-card__rank--bottom">{rank}</span>
    </div>
  );
};

export default PlayingCard;
```

- [ ] **Step 2: Create `src/styles/PlayingCard.css`**

```css
.playing-card {
  width: clamp(120px, 22vw, 170px);
  aspect-ratio: 5 / 7;
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-3);
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 0, 0, 0.05);
  transition: box-shadow var(--transition), transform var(--transition);
  animation: card-reveal 220ms ease-out;
}

@keyframes card-reveal {
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.playing-card--front {
  background: linear-gradient(160deg, #fdfbf4, #eee7d3);
  font-family: var(--font-display);
}

.playing-card--red {
  color: var(--red);
}

.playing-card--black {
  color: #16211a;
}

.playing-card__rank {
  font-size: clamp(20px, 4vw, 30px);
  line-height: 1;
}

.playing-card__rank--bottom {
  align-self: flex-end;
  transform: rotate(180deg);
}

.playing-card__suit {
  font-size: clamp(32px, 6vw, 48px);
  align-self: center;
}

.playing-card--correct {
  box-shadow: 0 0 0 3px var(--gold), 0 30px 60px -20px rgba(0, 0, 0, 0.7);
}

.playing-card--incorrect {
  box-shadow: 0 0 0 3px var(--red), 0 30px 60px -20px rgba(0, 0, 0, 0.7);
}

.playing-card--back {
  width: clamp(120px, 22vw, 170px);
  aspect-ratio: 5 / 7;
  border-radius: var(--radius);
  background: var(--felt-900);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
}

.playing-card__back-pattern {
  width: 70%;
  height: 70%;
  border: 1px solid var(--gold);
  border-radius: 4px;
  opacity: 0.5;
  background:
    repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(201, 168, 76, 0.15) 8px, rgba(201, 168, 76, 0.15) 9px);
}
```

- [ ] **Step 3: Remove the old card component**

```bash
git rm src/components/Card.jsx src/styles/Card.css
```

- [ ] **Step 4: Commit**

```bash
git add src/components/PlayingCard.jsx src/styles/PlayingCard.css
git commit -m "feat: add custom-drawn PlayingCard component"
```

(`PlayingCard` isn't wired into the app yet — that happens in Task 7. `npm run dev` will still show the old `Deck.jsx` importing the now-deleted `Card.jsx` until then, so don't run the dev server as a checkpoint here.)

---

### Task 6: `useCountdown` hook

Fixes half of **bug #2** (stale closures) for the timed-mode countdown specifically: the interval always reads the current `duration`/`onExpire` via refs, never a value captured at the moment the interval was started.

**Files:**
- Create: `src/hooks/useCountdown.jsx`

- [ ] **Step 1: Implement the hook**

```jsx
import { useState, useRef, useCallback, useEffect } from 'react';

const TICK_MS = 100;
const TICK_SECONDS = TICK_MS / 1000;

const useCountdown = (duration, onExpire) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);
  const durationRef = useRef(duration);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    setTimeLeft(durationRef.current);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= TICK_SECONDS) {
          stop();
          onExpireRef.current?.();
          return 0;
        }
        return prev - TICK_SECONDS;
      });
    }, TICK_MS);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { timeLeft, start, stop };
};

export default useCountdown;
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCountdown.jsx
git commit -m "feat: add useCountdown hook for timed-mode practice"
```

---

### Task 7: `PracticeStage` component (replaces `Deck.jsx`)

Fixes the other half of **bug #2** (results undercount on a correct final card) and **bug #3** (dangling timers after stop/unmount): critical result fields (`correctCount`, `incorrectCount`, `cardTimes`, `currentCardIndex`) are mirrored into refs updated in lockstep with `setState`, so `finishSimulation` always reads the current value no matter which render's closure ends up calling it. All `setTimeout`s are tracked in a ref array and cleared together on stop/unmount.

**Files:**
- Create: `src/components/PracticeStage.jsx`
- Create: `src/styles/PracticeStage.css`
- Delete: `src/components/Deck.jsx`
- Delete: `src/styles/Deck.css`

- [ ] **Step 1: Create `PracticeStage.jsx`**

```jsx
import { useState, useRef, useEffect } from 'react';
import PlayingCard from './PlayingCard';
import useCardCounting from '../hooks/useCardCounting';
import useCountdown from '../hooks/useCountdown';
import '../styles/PracticeStage.css';

const ANSWER_ADVANCE_DELAY = 800;
const INCORRECT_RETRY_DELAY = 1500;
const TIME_UP_ADVANCE_DELAY = 1500;

const PracticeStage = ({ mode, targetRate, deckSize, endSimulation }) => {
  const { deck, getRunningCountThrough } = useCardCounting(deckSize);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [flash, setFlash] = useState(null);
  const [status, setStatus] = useState('playing'); // playing | correct | incorrect
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [currentCardAttempts, setCurrentCardAttempts] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cardTimes, setCardTimes] = useState([]);

  const inputRef = useRef(null);
  const elapsedIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastCardTimeRef = useRef(null);
  const timeoutsRef = useRef([]);
  const finishedRef = useRef(false);

  // Mirrors of the state fields that MUST be correct no matter which
  // render's closure a delayed setTimeout/interval callback runs from.
  const currentCardIndexRef = useRef(0);
  const correctCountRef = useRef(0);
  const incorrectCountRef = useRef(0);
  const cardTimesRef = useRef([]);

  const scheduleTimeout = (fn, delay) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
      fn();
    }, delay);
    timeoutsRef.current.push(id);
  };

  const clearScheduledTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const handleTimeUp = () => {
    incorrectCountRef.current += 1;
    setIncorrectCount(incorrectCountRef.current);
    setStatus('incorrect');
    setFlash('incorrect');
    setFeedback("Time's up — moving to next card...");

    scheduleTimeout(() => {
      setFlash(null);
      nextCard();
    }, TIME_UP_ADVANCE_DELAY);
  };

  const countdown = useCountdown(targetRate, handleTimeUp);

  const nextCard = () => {
    const nextIndex = currentCardIndexRef.current + 1;

    if (nextIndex >= deck.length) {
      finishSimulation('Deck completed');
      return;
    }

    currentCardIndexRef.current = nextIndex;
    setCurrentCardIndex(nextIndex);
    setCurrentCardAttempts(0);
    setFeedback('');
    setStatus('playing');

    if (mode === 'timed') {
      countdown.start();
    }

    inputRef.current?.focus();
  };

  const finishSimulation = (reason) => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    clearScheduledTimeouts();
    countdown.stop();
    if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);

    const totalTime = (Date.now() - startTimeRef.current) / 1000;
    const cardsViewed = currentCardIndexRef.current + 1;
    const averageTime = cardsViewed > 0 ? totalTime / cardsViewed : 0;

    endSimulation({
      correctCount: correctCountRef.current,
      incorrectCount: incorrectCountRef.current,
      totalTime,
      averageTime,
      cardsViewed,
      cardTimes: cardTimesRef.current,
      reason,
    });
  };

  // Start the session once the deck has been built.
  useEffect(() => {
    if (deck.length === 0) return undefined;

    const now = Date.now();
    startTimeRef.current = now;
    lastCardTimeRef.current = now;

    elapsedIntervalRef.current = setInterval(() => {
      setElapsedTime((Date.now() - startTimeRef.current) / 1000);
    }, 100);

    if (mode === 'timed') {
      countdown.start();
    }

    inputRef.current?.focus();

    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
      countdown.stop();
      clearScheduledTimeouts();
    };
    // Runs once the deck is ready; mode/targetRate/deckSize are fixed for
    // the lifetime of a session (Settings disables editing while running).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.length > 0]);

  const checkAnswer = () => {
    if (status !== 'playing') return;

    const userValue = parseInt(userInput, 10);
    const expectedCount = getRunningCountThrough(currentCardIndex + 1);

    if (userValue === expectedCount) {
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
      setStatus('correct');
      setFlash('correct');
      setFeedback('Correct!');

      const now = Date.now();
      const timeTaken = (now - lastCardTimeRef.current) / 1000;
      cardTimesRef.current = [...cardTimesRef.current, timeTaken];
      setCardTimes(cardTimesRef.current);
      lastCardTimeRef.current = now;

      if (mode === 'timed') {
        countdown.stop();
      }

      scheduleTimeout(() => {
        setFlash(null);
        nextCard();
      }, ANSWER_ADVANCE_DELAY);
    } else {
      incorrectCountRef.current += 1;
      setIncorrectCount(incorrectCountRef.current);
      setCurrentCardAttempts((prev) => prev + 1);
      setStatus('incorrect');
      setFlash('incorrect');
      setFeedback(`Incorrect — try again (attempt ${currentCardAttempts + 1})`);

      scheduleTimeout(() => {
        setStatus('playing');
        setFeedback('');
        setFlash(null);
      }, INCORRECT_RETRY_DELAY);
    }

    setUserInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') checkAnswer();
  };

  const formatTime = (seconds) => seconds.toFixed(1);

  return (
    <div className="practice-stage">
      <div className="practice-stage__meta">
        <span className="practice-stage__meta-item">
          CARD {String(currentCardIndex + 1).padStart(2, '0')} / {deck.length}
        </span>
        <span className="practice-stage__meta-item">
          {formatTime(elapsedTime)}s ELAPSED
        </span>
        {mode === 'timed' && (
          <span
            className={`practice-stage__meta-item ${countdown.timeLeft < targetRate * 0.3 ? 'practice-stage__meta-item--warning' : ''}`}
          >
            {formatTime(countdown.timeLeft)}s LEFT
          </span>
        )}
      </div>

      {mode === 'timed' && (
        <div className="practice-stage__progress">
          <div
            className="practice-stage__progress-fill"
            style={{ width: `${(countdown.timeLeft / targetRate) * 100}%` }}
          />
        </div>
      )}

      <div className="practice-stage__card">
        <PlayingCard card={deck[currentCardIndex]} revealed flash={flash} />
      </div>

      <div className="practice-stage__input-help">
        Enter the running count including this card
      </div>

      <div className="practice-stage__input-row">
        <input
          ref={inputRef}
          type="number"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="practice-stage__input"
          placeholder="count"
          disabled={status !== 'playing'}
        />
        <button
          onClick={checkAnswer}
          className="practice-stage__submit"
          disabled={status !== 'playing'}
        >
          Enter
        </button>
      </div>

      {feedback && (
        <div className={`practice-stage__feedback practice-stage__feedback--${status}`}>
          {feedback}
        </div>
      )}

      <div className="practice-stage__stats">
        <span>Correct <b className="practice-stage__stat-value">{correctCount}</b></span>
        <span>Incorrect <b className="practice-stage__stat-value">{incorrectCount}</b></span>
        {currentCardAttempts > 0 && (
          <span>Attempts <b className="practice-stage__stat-value">{currentCardAttempts}</b></span>
        )}
      </div>

      <button onClick={() => finishSimulation('Stopped by user')} className="practice-stage__stop">
        Stop Session
      </button>
    </div>
  );
};

export default PracticeStage;
```

- [ ] **Step 2: Create `src/styles/PracticeStage.css`**

```css
.practice-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
}

.practice-stage__meta {
  display: flex;
  gap: var(--space-5);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-dim);
}

.practice-stage__meta-item--warning {
  color: var(--red);
}

.practice-stage__progress {
  width: 100%;
  max-width: 300px;
  height: 1px;
  background: var(--line);
}

.practice-stage__progress-fill {
  height: 100%;
  background: var(--gold);
  transition: width 100ms linear;
}

.practice-stage__card {
  margin: var(--space-4) 0;
}

.practice-stage__input-help {
  font-size: 13px;
  color: var(--ink-dim);
}

.practice-stage__input-row {
  display: flex;
  gap: var(--space-2);
}

.practice-stage__input {
  background: none;
  border: none;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 18px;
  text-align: center;
  width: 100px;
  padding: var(--space-2) 0;
  transition: border-color var(--transition);
}

.practice-stage__input:focus-visible {
  border-color: var(--gold);
  outline: none;
}

.practice-stage__submit {
  background: none;
  border: 1px solid var(--gold);
  color: var(--gold);
  padding: 0 var(--space-4);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: background var(--transition), color var(--transition);
}

.practice-stage__submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.practice-stage__submit:not(:disabled):hover {
  background: var(--gold);
  color: var(--felt-950);
}

.practice-stage__feedback {
  font-size: 13px;
  font-family: var(--font-mono);
}

.practice-stage__feedback--correct {
  color: var(--gold);
}

.practice-stage__feedback--incorrect {
  color: var(--red);
}

.practice-stage__stats {
  display: flex;
  gap: var(--space-5);
  font-size: 12px;
  color: var(--ink-dim);
  border-top: 1px solid var(--line);
  padding-top: var(--space-4);
  width: 100%;
  justify-content: center;
}

.practice-stage__stat-value {
  font-family: var(--font-mono);
  color: var(--ink);
}

.practice-stage__stop {
  background: none;
  border: none;
  color: var(--ink-dim);
  font-size: 12px;
  letter-spacing: 0.05em;
  text-decoration: underline;
  margin-top: var(--space-2);
}

.practice-stage__stop:hover {
  color: var(--ink);
}
```

- [ ] **Step 3: Remove the old component**

```bash
git rm src/components/Deck.jsx src/styles/Deck.css
```

- [ ] **Step 4: Commit**

```bash
git add src/components/PracticeStage.jsx src/styles/PracticeStage.css
git commit -m "fix: PracticeStage tracks results in refs to avoid stale-closure undercount

finishSimulation previously read correctCount/incorrectCount/cardTimes
from whichever render's closure happened to schedule it, undercounting
the final card when a session finished on a correct answer. All
setTimeouts are now tracked and cleared together on stop/unmount too."
```

(Not wired into `App.jsx` yet — Task 10 does that. Don't run `npm run dev` as a checkpoint until then.)

---

### Task 8: `SettingsPanel` component (replaces `Settings.jsx`)

**Files:**
- Create: `src/components/SettingsPanel.jsx`
- Create: `src/styles/SettingsPanel.css`
- Delete: `src/components/Settings.jsx`
- Delete: `src/styles/Settings.css`

- [ ] **Step 1: Create `SettingsPanel.jsx`**

```jsx
import '../styles/SettingsPanel.css';

const SettingsPanel = ({
  mode,
  setMode,
  targetRate,
  setTargetRate,
  deckSize,
  setDeckSize,
  startSimulation,
  isRunning,
}) => {
  return (
    <div className="settings-panel">
      <div className="settings-panel__field">
        <div className="settings-panel__label">Mode</div>
        <div className="settings-panel__modes">
          <button
            className={`settings-panel__mode ${mode === 'self-paced' ? 'settings-panel__mode--active' : ''}`}
            onClick={() => setMode('self-paced')}
            disabled={isRunning}
          >
            Self-Paced
          </button>
          <button
            className={`settings-panel__mode ${mode === 'timed' ? 'settings-panel__mode--active' : ''}`}
            onClick={() => setMode('timed')}
            disabled={isRunning}
          >
            Timed
          </button>
        </div>
      </div>

      {mode === 'timed' && (
        <div className="settings-panel__field">
          <div className="settings-panel__label">
            Time per card &mdash; <span className="settings-panel__value">{targetRate}s</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={targetRate}
            onChange={(e) => setTargetRate(parseFloat(e.target.value))}
            className="settings-panel__slider"
            disabled={isRunning}
          />
        </div>
      )}

      <div className="settings-panel__field">
        <div className="settings-panel__label">
          Deck size &mdash; <span className="settings-panel__value">{deckSize} cards</span>
        </div>
        <input
          type="range"
          min="10"
          max="312"
          step="1"
          value={deckSize}
          onChange={(e) => setDeckSize(parseInt(e.target.value, 10))}
          className="settings-panel__slider"
          disabled={isRunning}
        />
        <div className="settings-panel__presets">
          <button onClick={() => setDeckSize(52)} disabled={isRunning}>1 deck</button>
          <button onClick={() => setDeckSize(104)} disabled={isRunning}>2 decks</button>
          <button onClick={() => setDeckSize(312)} disabled={isRunning}>6 decks</button>
        </div>
      </div>

      <div className="settings-panel__field settings-panel__field--legend">
        <div className="settings-panel__label">Hi&ndash;Lo system</div>
        <div className="settings-panel__legend">
          <span className="settings-panel__legend-item settings-panel__legend-item--positive">+1 &nbsp;2&ndash;6</span>
          <span className="settings-panel__legend-item">0 &nbsp;7&ndash;9</span>
          <span className="settings-panel__legend-item settings-panel__legend-item--negative">&minus;1 &nbsp;10&ndash;A</span>
        </div>
      </div>

      <button
        onClick={startSimulation}
        className="settings-panel__cta"
        disabled={isRunning}
      >
        {isRunning ? 'Session running…' : 'Begin Session →'}
      </button>
    </div>
  );
};

export default SettingsPanel;
```

- [ ] **Step 2: Create `src/styles/SettingsPanel.css`**

```css
.settings-panel {
  display: flex;
  flex-direction: column;
}

.settings-panel__field {
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--line);
}

.settings-panel__field:first-child {
  padding-top: 0;
}

.settings-panel__label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-dim);
  margin-bottom: var(--space-3);
}

.settings-panel__value {
  font-family: var(--font-mono);
  color: var(--gold);
  text-transform: none;
  letter-spacing: normal;
}

.settings-panel__modes {
  display: flex;
  gap: var(--space-5);
}

.settings-panel__mode {
  background: none;
  border: none;
  border-bottom: 1px solid transparent;
  color: var(--ink-dim);
  font-size: 15px;
  padding-bottom: var(--space-1);
}

.settings-panel__mode--active {
  color: var(--ink);
  border-bottom-color: var(--gold);
}

.settings-panel__mode:disabled {
  cursor: not-allowed;
}

.settings-panel__slider {
  width: 100%;
  accent-color: var(--gold);
  background: transparent;
}

.settings-panel__presets {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.settings-panel__presets button {
  background: none;
  border: 1px solid var(--line);
  color: var(--ink-dim);
  font-size: 11px;
  padding: var(--space-2) var(--space-3);
}

.settings-panel__presets button:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--gold);
}

.settings-panel__legend {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink-dim);
}

.settings-panel__legend-item--positive {
  color: var(--gold);
}

.settings-panel__legend-item--negative {
  color: var(--red);
}

.settings-panel__cta {
  margin-top: var(--space-6);
  background: none;
  border: 1px solid var(--gold);
  color: var(--gold);
  padding: var(--space-3) var(--space-5);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: background var(--transition), color var(--transition);
}

.settings-panel__cta:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.settings-panel__cta:not(:disabled):hover {
  background: var(--gold);
  color: var(--felt-950);
}
```

- [ ] **Step 3: Remove the old component**

```bash
git rm src/components/Settings.jsx src/styles/Settings.css
```

- [ ] **Step 4: Commit**

```bash
git add src/components/SettingsPanel.jsx src/styles/SettingsPanel.css
git commit -m "feat: add restyled SettingsPanel component"
```

---

### Task 9: `ResultsView` component (replaces `Results.jsx`)

**Files:**
- Create: `src/components/ResultsView.jsx`
- Create: `src/styles/ResultsView.css`
- Delete: `src/components/Results.jsx`
- Delete: `src/styles/Results.css`

- [ ] **Step 1: Create `ResultsView.jsx`**

```jsx
import '../styles/ResultsView.css';

const getAccuracy = (results) => {
  const total = results.correctCount + results.incorrectCount;
  return total > 0 ? (results.correctCount / total) * 100 : 0;
};

const getGrade = (accuracy) => {
  if (accuracy >= 95) return { grade: 'A', description: 'Excellent' };
  if (accuracy >= 85) return { grade: 'B', description: 'Good' };
  if (accuracy >= 75) return { grade: 'C', description: 'Average' };
  if (accuracy >= 65) return { grade: 'D', description: 'Fair' };
  return { grade: 'F', description: 'Needs practice' };
};

const ResultsView = ({ results, resetSimulation }) => {
  const accuracy = getAccuracy(results);
  const { grade, description } = getGrade(accuracy);
  const maxTime = Math.max(1, ...(results.cardTimes ?? []));

  return (
    <div className="results-view">
      <div className="results-view__header">
        <div className="results-view__grade">{grade}</div>
        <div>
          <div className="results-view__description">{description}</div>
          {results.reason && <div className="results-view__reason">{results.reason}</div>}
        </div>
      </div>

      <div className="results-view__stats">
        <div className="results-view__stat">
          <span className="results-view__stat-label">Accuracy</span>
          <span className="results-view__stat-value">{accuracy.toFixed(1)}%</span>
        </div>
        <div className="results-view__stat">
          <span className="results-view__stat-label">Avg. time / card</span>
          <span className="results-view__stat-value">
            {Number.isNaN(results.averageTime) ? '0.0' : results.averageTime.toFixed(1)}s
          </span>
        </div>
        <div className="results-view__stat">
          <span className="results-view__stat-label">Correct</span>
          <span className="results-view__stat-value">{results.correctCount}</span>
        </div>
        <div className="results-view__stat">
          <span className="results-view__stat-label">Incorrect</span>
          <span className="results-view__stat-value">{results.incorrectCount}</span>
        </div>
        <div className="results-view__stat">
          <span className="results-view__stat-label">Cards seen</span>
          <span className="results-view__stat-value">
            {results.cardsViewed ?? results.correctCount + results.incorrectCount}
          </span>
        </div>
        <div className="results-view__stat">
          <span className="results-view__stat-label">Total time</span>
          <span className="results-view__stat-value">{results.totalTime.toFixed(1)}s</span>
        </div>
      </div>

      {results.cardTimes && results.cardTimes.length > 0 && (
        <div className="results-view__chart">
          <div className="results-view__label">Response time per card</div>
          <div className="results-view__bars">
            {results.cardTimes.map((time, index) => (
              <div key={index} className="results-view__bar-wrap" title={`${time.toFixed(1)}s`}>
                <div
                  className="results-view__bar"
                  style={{ height: `${Math.max(4, (time / maxTime) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={resetSimulation} className="results-view__cta">
        Try again →
      </button>
    </div>
  );
};

export default ResultsView;
```

- [ ] **Step 2: Create `src/styles/ResultsView.css`**

```css
.results-view {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.results-view__header {
  display: flex;
  align-items: baseline;
  gap: var(--space-5);
  border-bottom: 1px solid var(--line);
  padding-bottom: var(--space-5);
}

.results-view__grade {
  font-family: var(--font-display);
  font-size: 56px;
  color: var(--gold);
  line-height: 1;
}

.results-view__description {
  font-size: 15px;
}

.results-view__reason {
  font-size: 12px;
  color: var(--ink-dim);
  margin-top: var(--space-1);
}

.results-view__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4) var(--space-6);
}

.results-view__stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.results-view__stat-label {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.results-view__stat-value {
  font-family: var(--font-mono);
  font-size: 20px;
}

.results-view__label {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-dim);
  margin-bottom: var(--space-3);
}

.results-view__bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 80px;
  border-bottom: 1px solid var(--line);
}

.results-view__bar-wrap {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.results-view__bar {
  width: 100%;
  background: var(--gold);
  opacity: 0.7;
  min-height: 2px;
  transition: opacity var(--transition);
}

.results-view__bar-wrap:hover .results-view__bar {
  opacity: 1;
}

.results-view__cta {
  align-self: flex-start;
  background: none;
  border: 1px solid var(--gold);
  color: var(--gold);
  padding: var(--space-3) var(--space-5);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: background var(--transition), color var(--transition);
}

.results-view__cta:hover {
  background: var(--gold);
  color: var(--felt-950);
}
```

- [ ] **Step 3: Remove the old component**

```bash
git rm src/components/Results.jsx src/styles/Results.css
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ResultsView.jsx src/styles/ResultsView.css
git commit -m "feat: add restyled ResultsView component"
```

---

### Task 10: Rewrite `App.jsx` and `App.css` to wire everything together

Fixes **bug #4**: drops the dead `stopSimulation` function/prop (it was never called from `Deck.jsx`; `PracticeStage` calls `finishSimulation` directly, which invokes `endSimulation`).

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/styles/App.css`

- [ ] **Step 1: Rewrite `App.jsx`**

```jsx
import { useState } from 'react';
import PracticeStage from './components/PracticeStage';
import SettingsPanel from './components/SettingsPanel';
import ResultsView from './components/ResultsView';
import './styles/App.css';

function App() {
  const [mode, setMode] = useState('self-paced');
  const [targetRate, setTargetRate] = useState(2);
  const [deckSize, setDeckSize] = useState(52);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  const startSimulation = () => {
    setIsRunning(true);
    setShowResults(false);
  };

  const endSimulation = (simulationResults) => {
    setResults(simulationResults);
    setIsRunning(false);
    setShowResults(true);
  };

  const resetSimulation = () => {
    setShowResults(false);
  };

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__wordmark">Hi&middot;Lo <span className="app__wordmark-accent">Master</span></span>
      </header>

      <main className="app__layout">
        <div className="app__settings">
          <SettingsPanel
            mode={mode}
            setMode={setMode}
            targetRate={targetRate}
            setTargetRate={setTargetRate}
            deckSize={deckSize}
            setDeckSize={setDeckSize}
            startSimulation={startSimulation}
            isRunning={isRunning}
          />
        </div>

        <div className="app__rule" aria-hidden="true" />

        <div className="app__stage">
          {isRunning && (
            <PracticeStage
              mode={mode}
              targetRate={targetRate}
              deckSize={deckSize}
              endSimulation={endSimulation}
            />
          )}

          {showResults && results && (
            <ResultsView results={results} resetSimulation={resetSimulation} />
          )}

          {!isRunning && !showResults && (
            <div className="app__welcome">
              <h2 className="app__welcome-title">Practice your counting skills</h2>
              <p className="app__welcome-copy">
                Configure your session on the left and begin when you're ready.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="app__footer">
        Made by <a href="https://www.danilmerinov.com" target="_blank" rel="noopener noreferrer">Danil Merinov</a>
        <span className="app__footer-divider">&middot;</span>
        <a href="https://github.com/dan1lm/blackjack-card-counter" target="_blank" rel="noopener noreferrer">
          View on GitHub
        </a>
      </footer>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: Rewrite `src/styles/App.css`**

```css
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: var(--space-6) var(--space-6) var(--space-5);
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

.app__header {
  margin-bottom: var(--space-7);
}

.app__wordmark {
  font-family: var(--font-display);
  font-size: clamp(18px, 2.4vw, 22px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app__wordmark-accent {
  color: var(--gold);
}

.app__layout {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1px 1fr;
  gap: var(--space-7);
  align-items: start;
}

.app__rule {
  background: var(--line);
  align-self: stretch;
}

.app__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.app__welcome {
  text-align: center;
  max-width: 360px;
}

.app__welcome-title {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 24px;
  margin-bottom: var(--space-3);
}

.app__welcome-copy {
  color: var(--ink-dim);
  font-size: 14px;
}

.app__footer {
  margin-top: var(--space-7);
  padding-top: var(--space-4);
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--ink-dim);
  text-align: center;
}

.app__footer-divider {
  margin: 0 var(--space-2);
}

@media (max-width: 640px) {
  .app {
    padding: var(--space-5) var(--space-4);
  }

  .app__layout {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }

  .app__rule {
    display: none;
  }
}
```

- [ ] **Step 3: Run the app and manually verify**

Run: `npm run dev`

Open the printed local URL and check:
- Desktop width (≥640px): two-column layout, settings on the left, hairline divider, practice stage on the right.
- Resize below 640px: layout collapses to a single column.
- Start a **self-paced** session, deck size 10: cards should span multiple suits across a few restarts (confirms the deck-sampling fix).
- Answer every card correctly through to the last card: results screen's "Correct" count should equal the number of cards in the deck (confirms the stale-closure fix — this was undercounting by 1 before).
- Start a **timed** session, let it run, click **Stop Session** mid-countdown: no console errors about setting state on an unmounted component (confirms the dangling-timer fix).

- [ ] **Step 4: Run lint and tests**

Run: `npx eslint .`
Expected: no errors.

Run: `npm test`
Expected: all `deck.test.js` tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/styles/App.css
git commit -m "feat: rewrite App layout for casino-noir redesign, drop dead stopSimulation"
```

---

## Self-review notes

- **Spec coverage:** palette/typography/motion → Tasks 4–9; card rendering → Task 5; component architecture (all five components + `useCountdown`) → Tasks 3, 5–10; responsive strategy → Task 10 (`app__layout` breakpoint); all three code-review bugs → Tasks 2, 6–7, 10; dead code/unused assets → Tasks 4, 10; testing → Task 2. `Tailwind` and deployment/footer/favicon explicitly out of scope per spec — untouched.
- **Type/naming consistency:** `getRunningCountThrough(deck, upToIndex)` defined in Task 2, used identically in Task 3's hook and Task 7's `PracticeStage`. `PlayingCard` props (`card`, `revealed`, `flash`) defined in Task 5, used identically in Task 7. `finishSimulation(reason)` and `endSimulation(results)` shapes match between Task 7 and Task 10.
- **No placeholders:** every step has complete, runnable code — verified by re-reading each task.
