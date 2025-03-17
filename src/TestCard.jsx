// File to test a card component
import React, { useState } from 'react';
import Card from './components/Card.jsx';

const TestCard = () => {
  const [isFlipped, setIsFlipped] = useState(true);
  const [currentCard, setCurrentCard] = useState({ rank: 'A', suit: 'hearts' });
  
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const randomCard = () => {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    setCurrentCard({ rank, suit });
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Card Component Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <Card card={currentCard} isFlipped={isFlipped} />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setIsFlipped(!isFlipped)}>
          {isFlipped ? 'Show Back' : 'Show Front'}
        </button>
        <button onClick={randomCard} style={{ marginLeft: '10px' }}>
          Random Card
        </button>
      </div>
      
      <div>
        <h3>Current card: {currentCard.rank} of {currentCard.suit}</h3>
      </div>
    </div>
  );
};

export default TestCard;