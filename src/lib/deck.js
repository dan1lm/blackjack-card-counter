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
