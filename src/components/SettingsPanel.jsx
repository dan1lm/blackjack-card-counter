import '../styles/SettingsPanel.css';

const SettingsPanel = ({
  mode,
  setMode,
  targetRate,
  setTargetRate,
  deckSize,
  setDeckSize,
  startSimulation,
  isRunning,
}) => {
  return (
    <div className="settings-panel">
      <div className="settings-panel__field">
        <div className="settings-panel__label">Mode</div>
        <div className="settings-panel__modes">
          <button
            className={`settings-panel__mode ${mode === 'self-paced' ? 'settings-panel__mode--active' : ''}`}
            onClick={() => setMode('self-paced')}
            disabled={isRunning}
          >
            Self-Paced
          </button>
          <button
            className={`settings-panel__mode ${mode === 'timed' ? 'settings-panel__mode--active' : ''}`}
            onClick={() => setMode('timed')}
            disabled={isRunning}
          >
            Timed
          </button>
        </div>
      </div>

      {mode === 'timed' && (
        <div className="settings-panel__field">
          <div className="settings-panel__label">
            Time per card &mdash; <span className="settings-panel__value">{targetRate}s</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={targetRate}
            onChange={(e) => setTargetRate(parseFloat(e.target.value))}
            className="settings-panel__slider"
            disabled={isRunning}
          />
        </div>
      )}

      <div className="settings-panel__field">
        <div className="settings-panel__label">
          Deck size &mdash; <span className="settings-panel__value">{deckSize} cards</span>
        </div>
        <input
          type="range"
          min="10"
          max="312"
          step="1"
          value={deckSize}
          onChange={(e) => setDeckSize(parseInt(e.target.value, 10))}
          className="settings-panel__slider"
          disabled={isRunning}
        />
        <div className="settings-panel__presets">
          <button onClick={() => setDeckSize(52)} disabled={isRunning}>1 deck</button>
          <button onClick={() => setDeckSize(104)} disabled={isRunning}>2 decks</button>
          <button onClick={() => setDeckSize(312)} disabled={isRunning}>6 decks</button>
        </div>
      </div>

      <div className="settings-panel__field settings-panel__field--legend">
        <div className="settings-panel__label">Hi&ndash;Lo system</div>
        <div className="settings-panel__legend">
          <span className="settings-panel__legend-item settings-panel__legend-item--positive">+1 &nbsp;2&ndash;6</span>
          <span className="settings-panel__legend-item">0 &nbsp;7&ndash;9</span>
          <span className="settings-panel__legend-item settings-panel__legend-item--negative">&minus;1 &nbsp;10&ndash;A</span>
        </div>
      </div>

      <button
        onClick={startSimulation}
        className="settings-panel__cta"
        disabled={isRunning}
      >
        {isRunning ? 'Session running…' : 'Begin Session →'}
      </button>
    </div>
  );
};

export default SettingsPanel;
