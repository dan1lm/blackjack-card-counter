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
        <details className="app__settings" open>
          <summary className="app__settings-summary">Session Settings</summary>
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
        </details>

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
