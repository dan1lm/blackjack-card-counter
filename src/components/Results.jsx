import React from 'react';
import '../styles/Results.css';

const Results = ({ results, resetSimulation }) => {
    const calculateAccuracy = () => {
        const total = results.correctCount + results.incorrectCount;
        return total > 0 ? ((results.correctCount / total) * 100).toFixed(1) : 0;
    };
    
    const getGrade = () => {
        const accuracy = parseFloat(calculateAccuracy());
        if (accuracy >= 95) return { grade: 'A', description: 'Excellent' };
        if (accuracy >= 85) return { grade: 'B', description: 'Good' };
        if (accuracy >= 75) return { grade: 'C', description: 'Average' };
        if (accuracy >= 65) return { grade: 'D', description: 'Fair' };
        return { grade: 'F', description: 'Needs Practice' };
    };
    
    const gradeInfo = getGrade();

    return (
        <div className="results-container">
            <div className="results-header">
                <h2>Simulation Results</h2>
                {results.reason && (
                    <div className="completion-reason">
                        {results.reason}
                    </div>
                )}
            </div>
            
            <div className="grade-section">
                <div className="grade-display">
                    <div className="grade">{gradeInfo.grade}</div>
                    <div className="grade-label">{gradeInfo.description}</div>
                </div>
                <div className="stats-summary">
                    <div className="stat">
                        <div className="stat-value">{calculateAccuracy()}%</div>
                        <div className="stat-label">Accuracy</div>
                    </div>
                    <div className="stat">
                        <div className="stat-value">{isNaN(results.averageTime) ? "0.0" : results.averageTime.toFixed(1)}s</div>
                        <div className="stat-label">Avg. Time per Card</div>
                    </div>
                </div>
            </div>
            
            <div className="stats-details">
                <div className="stats-row">
                    <div className="stat-box">
                        <div className="stat-label">Correct Counts</div>
                        <div className="stat-value correct">{results.correctCount}</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-label">Incorrect Counts</div>
                        <div className="stat-value incorrect">{results.incorrectCount}</div>
                    </div>
                </div>
                <div className="stats-row">
                    <div className="stat-box">
                        <div className="stat-label">Total Cards</div>
                        <div className="stat-value">{results.cardsViewed || (results.correctCount + results.incorrectCount)}</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-label">Total Time</div>
                        <div className="stat-value">{results.totalTime.toFixed(1)}s</div>
                    </div>
                </div>
            </div>
            
            {results.cardTimes && results.cardTimes.length > 0 && (
                <div className="time-chart-container">
                    <h3>Response Time per Card</h3>
                    <div className="time-chart">
                        {results.cardTimes.map((time, index) => (
                            <div 
                                key={index}
                                className="time-bar-container"
                            >
                                <div 
                                    className="time-bar"
                                    style={{
                                        height: `${Math.min(time / 5 * 100, 100)}%`,
                                    }}
                                >
                                    <div className="time-tooltip">{time.toFixed(1)}s</div>
                                </div>
                                <div className="card-number">{index + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="actions">
                <button onClick={resetSimulation} className="try-again-button">
                    Try Again
                </button>
            </div>
        </div>
    );
};

export default Results;