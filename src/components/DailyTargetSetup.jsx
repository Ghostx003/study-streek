import { useState } from 'react';
import { Clock, Timer } from 'lucide-react';

export function DailyTargetSetup({ onEstablishTarget }) {
  const [targetHours, setTargetHours] = useState('6');
  const [mode, setMode] = useState('hourly'); // 'hourly' | 'pomodoro'
  const [pomodoroOption, setPomodoroOption] = useState('25');
  const [customPomodoroMinutes, setCustomPomodoroMinutes] = useState('30');
  const [error, setError] = useState('');

  const presetHours = ['4', '6', '8', '10'];
  const pomodoroPresets = ['25', '35', '45', 'custom'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const hours = parseFloat(targetHours);
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter a valid study target in hours.');
      return;
    }
    if (hours > 24) {
      setError('Study target cannot exceed 24 hours in a single day.');
      return;
    }

    if (mode === 'pomodoro' && pomodoroOption === 'custom') {
      const customMins = parseInt(customPomodoroMinutes, 10);
      if (isNaN(customMins) || customMins < 5 || customMins > 240) {
        setError('Custom Pomodoro duration must be between 5 and 240 minutes.');
        return;
      }
    }

    setError('');
    onEstablishTarget({
      targetHours: hours,
      mode,
      pomodoroOption,
      customPomodoroMinutes: parseInt(customPomodoroMinutes, 10) || 30
    });
  };

  return (
    <div className="daily-setup-container">
      <div className="card daily-setup-card">
        <div className="setup-header">
          <h2 className="setup-question">What is your study target for today?</h2>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          {/* Target Hours Section */}
          <div className="form-group">
            <label className="form-label" htmlFor="target-hours-input">
              Target Duration (Hours)
            </label>
            <div className="presets-row">
              {presetHours.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`btn-preset ${targetHours === preset ? 'active' : ''}`}
                  onClick={() => {
                    setTargetHours(preset);
                    setError('');
                  }}
                >
                  {preset} Hours
                </button>
              ))}
            </div>

            <div className="input-group">
              <input
                id="target-hours-input"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                className="input-text"
                value={targetHours}
                onChange={(e) => {
                  setTargetHours(e.target.value);
                  setError('');
                }}
                placeholder="e.g. 6 or 4.5"
                required
              />
              <span className="input-suffix">Hours</span>
            </div>
          </div>

          {/* Tracking Mode Selection */}
          <div className="form-group">
            <label className="form-label">Tracking Mode</label>
            <div className="mode-selector-grid">
              <button
                type="button"
                className={`mode-option-btn ${mode === 'hourly' ? 'active' : ''}`}
                onClick={() => setMode('hourly')}
              >
                <div className="mode-btn-content">
                  <Clock className="mode-icon" />
                  <div className="mode-text">
                    <span className="mode-title">Hour-wise Tracking</span>
                    <span className="mode-subtitle">1-hour sessions</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={`mode-option-btn ${mode === 'pomodoro' ? 'active' : ''}`}
                onClick={() => setMode('pomodoro')}
              >
                <div className="mode-btn-content">
                  <Timer className="mode-icon" />
                  <div className="mode-text">
                    <span className="mode-title">Pomodoro Tracking</span>
                    <span className="mode-subtitle">Shorter interval sessions</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Pomodoro Options if selected */}
          {mode === 'pomodoro' && (
            <div className="form-group pomodoro-options-group">
              <label className="form-label">Pomodoro Duration</label>
              <div className="presets-row">
                {pomodoroPresets.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`btn-preset ${pomodoroOption === opt ? 'active' : ''}`}
                    onClick={() => setPomodoroOption(opt)}
                  >
                    {opt === 'custom' ? 'Custom' : `${opt} min`}
                  </button>
                ))}
              </div>

              {pomodoroOption === 'custom' && (
                <div className="input-group mt-2">
                  <input
                    type="number"
                    min="5"
                    max="240"
                    step="1"
                    className="input-text"
                    value={customPomodoroMinutes}
                    onChange={(e) => setCustomPomodoroMinutes(e.target.value)}
                    placeholder="Minutes per session"
                    required
                  />
                  <span className="input-suffix">Minutes</span>
                </div>
              )}
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn-primary btn-block">
            Start Tracking
          </button>
        </form>
      </div>
    </div>
  );
}
