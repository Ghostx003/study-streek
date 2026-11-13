import { useState } from 'react';
import { X, Clock, Timer } from 'lucide-react';

export function TargetEditModal({ currentRecord, onUpdateTarget, onClose }) {
  const [targetHours, setTargetHours] = useState(
    currentRecord ? String(currentRecord.targetHours) : '6'
  );
  const [mode, setMode] = useState(currentRecord ? currentRecord.mode : 'hourly');
  const [pomodoroOption, setPomodoroOption] = useState(
    currentRecord?.pomodoroOption || '25'
  );
  const [customPomodoroMinutes, setCustomPomodoroMinutes] = useState(
    currentRecord?.customPomodoroMinutes ? String(currentRecord.customPomodoroMinutes) : '30'
  );
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
      setError('Target cannot exceed 24 hours.');
      return;
    }

    if (mode === 'pomodoro' && pomodoroOption === 'custom') {
      const customMins = parseInt(customPomodoroMinutes, 10);
      if (isNaN(customMins) || customMins < 5 || customMins > 240) {
        setError('Custom Pomodoro duration must be between 5 and 240 minutes.');
        return;
      }
    }

    onUpdateTarget({
      newTargetHours: hours,
      mode,
      pomodoroOption,
      customPomodoroMinutes: parseInt(customPomodoroMinutes, 10) || 30
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Today's Target</h3>
          <button type="button" className="btn-icon-close" onClick={onClose} aria-label="Close">
            <X className="icon-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label className="form-label">Target Duration (Hours)</label>
            <div className="presets-row">
              {presetHours.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`btn-preset ${targetHours === preset ? 'active' : ''}`}
                  onClick={() => setTargetHours(preset)}
                >
                  {preset}h
                </button>
              ))}
            </div>

            <div className="input-group">
              <input
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
                required
              />
              <span className="input-suffix">Hours</span>
            </div>
          </div>

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
                    <span className="mode-title">Hour-wise</span>
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
                    <span className="mode-title">Pomodoro</span>
                    <span className="mode-subtitle">Interval sessions</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

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
                    required
                  />
                  <span className="input-suffix">Minutes</span>
                </div>
              )}
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
