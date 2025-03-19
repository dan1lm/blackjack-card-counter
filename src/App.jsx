import { useState } from 'react'

import './App.css'
import Card from './components/Card.jsx'

import TestCard from './TestCard.jsx';
import Deck from './components/Deck.jsx';

function App() {

  const testProps = {
    mode: 'self-paced',
    targetRate: 2,
    deckSize: 10,
    stopSimulation: () => console.log('Stop clicked'),
    endSimulation: (results) => console.log('Simulation ended', results)
  };
  
  return (
    <div className="container">
      <h1 className="title">Deck Component Development</h1>
      <Deck {...testProps} />
    </div>
  );
}

export default App
