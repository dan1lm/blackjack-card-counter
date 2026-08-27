import '../styles/ResultsView.css';

const getAccuracy = (results) => {
  const total = results.correctCount + results.incorrectCount;
  return total > 0 ? (results.correctCount / total) * 100 : 0;
};

const getGrade = (accuracy) => {
  if (accuracy >= 95) return { grade: 'A', description: 'Excellent' };
  if (accuracy >= 85) return { grade: 'B', description: 'Good' };
  if (accuracy >= 75) return { grade: 'C', description: 'Average' };
  if (accuracy >= 65) return { grade: 'D', description: 'Fair' };
  return { grade: 'F', description: 'Needs practice' };
};

const ResultsView = ({ results, resetSimulation }) => {
  const accuracy = getAccuracy(results);
  const { grade, description } = getGrade(accuracy);
  const maxTime = Math.max(1, ...(results.cardTimes ?? []));

  return (
    <div className="results-view">
      <div className="results-view__header">
        <div className="results-view__grade">{grade}</div>
        <div>
          <div className="results-view__description">{description}</div>
          {results.reason && <div className="results-view__reason">{results.reason}</div>}
        </div>
      </div>

      <div className="results-view__stats">
        <div className="results-view__stat">
          <span className="results-view__stat-label">Accuracy</span>
          <span className="results-view__stat-value">{accuracy.toFixed(1)}%</span>
        </div>
        <div className="results-view__stat">
          <span className="results-view__stat-label">Avg. time / card</span>
          <span className="results-view__stat-value">
            {Number.isNaN(results.averageTime) ? '0.0' : results.averageTime.toFixed(1)}s
          </span>
        </div>
        <div className="results-view__stat">
          <span className="results-view__stat-label">Correct</span>
          <span className="results-view__stat-value">{results.correctCount}</span>
        </div>
        <div className="results-view__stat">
          <span className="results-view__stat-label">Incorrect</span>
          <span className="results-view__stat-value">{results.incorrectCount}</span>
        </div>
        <div className="results-view__stat">
          <span className="results-view__stat-label">Cards seen</span>
          <span className="results-view__stat-value">
            {results.cardsViewed ?? results.correctCount + results.incorrectCount}
          </span>
        </div>
        <div className="results-view__stat">
          <span className="results-view__stat-label">Total time</span>
          <span className="results-view__stat-value">{results.totalTime.toFixed(1)}s</span>
        </div>
      </div>

      {results.cardTimes && results.cardTimes.length > 0 && (
        <div className="results-view__chart">
          <div className="results-view__label">Response time per card</div>
          <div className="results-view__bars">
            {results.cardTimes.map((time, index) => (
              <div key={index} className="results-view__bar-wrap" title={`${time.toFixed(1)}s`}>
                <div
                  className="results-view__bar"
                  style={{ height: `${Math.max(4, (time / maxTime) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={resetSimulation} className="results-view__cta">
        Try again →
      </button>
    </div>
  );
};

export default ResultsView;
