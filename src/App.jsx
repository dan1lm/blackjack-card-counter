import { useState } from 'react'

import './App.css'
import Card from './components/Card'

import TestCard from './TestCard.jsx';

function App() {
  return (
    <div className="container">
      <h1 className="title">Card Test Page</h1>
      <TestCard />
    </div>
  );
}

export default App
