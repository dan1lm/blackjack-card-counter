import React from 'react';
import '../styles/Settings.css';

const Settings = ({ 
  mode, 
  setMode, 
  targetRate, 
  setTargetRate, 
  deckSize, 
  setDeckSize, 
  startSimulation 
}) => {
  return (
    <div className="settings-panel">
      <h2 className="settings-title">Simulator Settings</h2>
      
      <div className="setting-group">
        <label className="setting-label">Mode:</label>
        <div className="mode-selector">
          <button
            className={`mode-button ${mode === 'timed' ? 'active' : ''}`}
            onClick={() => setMode('timed')}
          >
            Timed Mode
          </button>
          <button
            className={`mode-button ${mode === 'self-paced' ? 'active' : ''}`}
            onClick={() => setMode('self-paced')}
          >
            Self-Paced Mode
          </button>
        </div>
      </div>
      
      {mode === 'timed' && (
        <div className="setting-group">
          <label className="setting-label">
            Target Rate (seconds per card): {targetRate}
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={targetRate}
            onChange={(e) => setTargetRate(parseFloat(e.target.value))}
            className="range-slider"
          />
          <div className="range-labels">
            <span>Fast (0.5s)</span>
            <span>Slow (5s)</span>
          </div>
        </div>
      )}
      
      <div className="setting-group">
        <label className="setting-label">
          Deck Size: {deckSize} cards
        </label>
        <input
          type="range"
          min="10"
          max="312" 
          step="1"
          value={deckSize}
          onChange={(e) => setDeckSize(parseInt(e.target.value))}
          className="range-slider"
        />
        <div className="range-labels">
          <span>10 cards</span>
          <span>312 cards (6 decks)</span>
        </div>
        <div className="deck-shortcuts">
          <button
            className="deck-preset-button"
            onClick={() => setDeckSize(52)} 
          >
            1 Deck
          </button>
          <button
            className="deck-preset-button"
            onClick={() => setDeckSize(104)} 
          >
            2 Decks
          </button>
          <button
            className="deck-preset-button"
            onClick={() => setDeckSize(156)} 
          >
            3 Decks
          </button>
          <button
            className="deck-preset-button"
            onClick={() => setDeckSize(312)} 
          >
            6 Decks
          </button>
        </div>
      </div>
      
      <div className="action-group">
        <button
          onClick={startSimulation}
          className="start-button"
        >
          Start Simulation
        </button>
      </div>
      
      <div className="info-box">
        <h3 className="info-title">Hi-Lo Card Counting Rules:</h3>
        <ul className="rules-list">
          <li>Cards 2-6: <span className="positive-count">+1</span></li>
          <li>Cards 7-9: <span className="neutral-count">0</span></li>
          <li>Cards 10, J, Q, K, A: <span className="negative-count">-1</span></li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;