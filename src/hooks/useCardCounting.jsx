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