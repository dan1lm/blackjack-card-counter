import React from 'react';
import '../styles/Results.css';

const Results = ({ results, resetSimulation }) => {
    const calculateAccuracy = () => {
        const total = results.correctCount + results.incorrectCount;
        return total > 0 ? ((results.correctCount  /total) * 100).toFixed(1) : 0;
    };

    return (
        <div className="results-panel">
          <h2 className="results-title">Simulation Results</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <h3 className="stat-title">Accuracy</h3>
              <div className="stat-value">{calculateAccuracy()}%</div>
              <div className="stat-details">
                {results.correctCount} correct / {results.correctCount + results.incorrectCount} total
              </div>
            </div>
            
            <div className="stat-card">
              <h3 className="stat-title">Timing</h3>
              <div className="stat-value">
                {results.averageTime.toFixed(2)} sec
              </div>
              <div className="stat-details">
                Average time per card
              </div>
            </div>
          </div>
          
          {results.cardTimes && results.cardTimes.length > 0 && (
            <div className="chart-container">
              <h3 className="chart-title">Time Per Card</h3>
              <div className="time-chart">
                <div className="chart-bars">
                  {results.cardTimes.map((time, index) => (
                    <div  
                    key={index} 
                    className="time-bar"
                    style={{
                        height: `${Math.min(time / 5 * 100, 100)}%`,
                        left: `${index * (100 / results.cardTimes.length)}%`,
                      }}
                      title={`Card ${index + 1}: ${time.toFixed(2)}s`}
                    >
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="action-container">
            <button onClick={resetSimulation} className="try-again-button"> Try Again </button>
          </div>
        </div>
      );
};
export default Results;