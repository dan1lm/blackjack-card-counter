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
