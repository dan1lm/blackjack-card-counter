import React from 'react';
import '../styles/Settings.css';

const Settings = ({ 
  mode, 
  setMode, 
  targetRate, 
  setTargetRate, 
  deckSize, 
  setDeckSize, 
  startSimulation,
  isRunning
}) => {
  return (
    <div className="settings-panel">
      <h2 className="settings-title">Settings</h2>
      
      <div className="setting-group mode-setting-group">
        <label className="setting-label">Mode:</label>
        <div className="mode-selector">
          <button
            className={`mode-button ${mode === 'timed' ? 'active' : ''}`}
            onClick={() => setMode('timed')}
            disabled={isRunning}
          >
            Timed Mode
          </button>
          <button
            className={`mode-button ${mode === 'self-paced' ? 'active' : ''}`}
            onClick={() => setMode('self-paced')}
            disabled={isRunning}
          >
            Self-Paced
          </button>
        </div>
      </div>
      
      <div className="setting-group rate-setting-group">
        <label className="setting-label">
          {mode === 'timed' ? `Time per card: ${targetRate}s` : ' '}
        </label>
        {mode === 'timed' ? (
          <div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={targetRate}
              onChange={(e) => setTargetRate(parseFloat(e.target.value))}
              className="range-slider"
              disabled={isRunning}
            />
            <div className="range-labels">
              <span>Fast (1s)</span>
              <span>Slow (5s)</span>
            </div>
          </div>
        ) : (
          <div className="placeholder-height"></div>
        )}
      </div>
      
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
          disabled={isRunning}
        />
        <div className="deck-shortcuts">
          <button
            className="deck-preset-button"
            onClick={() => setDeckSize(52)} 
            disabled={isRunning}
          >
            1 Deck
          </button>
          <button
            className="deck-preset-button"
            onClick={() => setDeckSize(104)} 
            disabled={isRunning}
          >
            2 Decks
          </button>
          <button
            className="deck-preset-button"
            onClick={() => setDeckSize(312)} 
            disabled={isRunning}
          >
            6 Decks
          </button>
        </div>
      </div>
      
      <div className="info-box">
        <h3 className="info-title">Hi-Lo Card Counting</h3>
        <div className="card-values">
          <div className="card-value positive">
            <span className="value">+1</span>
            <span className="cards">2, 3, 4, 5, 6</span>
          </div>
          <div className="card-value neutral">
            <span className="value">0</span>
            <span className="cards">7, 8, 9</span>
          </div>
          <div className="card-value negative">
            <span className="value">-1</span>
            <span className="cards">10, J, Q, K, A</span>
          </div>
        </div>
      </div>
      
      <div className="action-group">
        <button
          onClick={startSimulation}
          className="start-button"
          disabled={isRunning}
        >
          {isRunning ? 'Simulation Running...' : 'Start Simulation'}
        </button>
      </div>
      
      <div className="game-rules">
        <h3>How to Play:</h3>
        <p>
          {mode === 'self-paced' 
            ? "Enter the running count including the current card shown. If you enter an incorrect count, you'll get another chance."
            : "Cards will flip every " + targetRate + " seconds. Enter the running count including the current card before time runs out."
          }
        </p>
        <p className="example-text">
          Example: If first card is a 2 (worth +1), enter "+1". If next card is a 5 (worth +1), enter "+2".
        </p>
      </div>
    </div>
  );
};

export default Settings;