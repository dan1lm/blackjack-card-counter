import { useState } from 'react';
import Deck from './components/Deck';
import Settings from './components/Settings';
import Results from './components/Results';
import './styles/App.css';

function App() {
  const [mode, setMode] = useState('self-paced');
  const [targetRate, setTargetRate] = useState(2);
  const [deckSize, setDeckSize] = useState(52);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({
    correctCount: 0,
    incorrectCount: 0,
    totalTime: 0,
    averageTime: 0,
    cardTimes: [],
  });

  const startSimulation = () => {
    setIsRunning(true);
    setShowResults(false);
  };

  const stopSimulation = () => {
    setIsRunning(false);
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
    <div className="app-container">
      
      <div className="app-layout">
        <div className="left-panel">
          <Settings 
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
        

        <div className="right-panel">
          {isRunning && (
            <Deck 
              mode={mode}
              targetRate={targetRate}
              deckSize={deckSize}
              stopSimulation={stopSimulation}
              endSimulation={endSimulation}
            />
          )}
          
          {showResults && (
            <Results 
              results={results} 
              resetSimulation={resetSimulation}
            />
          )}
          
          {!isRunning && !showResults && (
            <div className="welcome-panel">
              <h2>Practice your counting skills!</h2>
              <p>Configure your settings on the left and click "Start Simulation" to begin.</p>
              <div className="card-examples">
                <div className="card-example low">
                  <span>+1</span>
                  <small>2-6</small>
                </div>
                <div className="card-example neutral">
                  <span>0</span>
                  <small>7-9</small>
                </div>
                <div className="card-example high">
                  <span>-1</span>
                  <small>10-A</small>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="app-footer">
        <div className="footer-content">
          Made by <a href="https://www.danilmerinov.com" target="_blank" rel="noopener noreferrer">Danil Merinov</a>
          <span className="footer-divider">|</span>
          <a href="https://github.com/dan1lm/blackjack-card-counter" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;