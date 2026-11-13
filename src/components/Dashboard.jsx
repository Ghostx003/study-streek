import { formatDisplayDate, formatDuration } from '../utils/dateUtils';
import { Edit3, CheckCircle2 } from 'lucide-react';

export function Dashboard({
  record,
  onOpenEditTarget
}) {
  if (!record) return null;

  const dateStr = record.date;
  const targetHours = record.targetHours;
  const targetMinutes = record.targetDurationMinutes || (targetHours * 60);
  const completedMinutes = record.completedDurationMinutes || 0;
  const remainingMinutes = Math.max(0, targetMinutes - completedMinutes);

  const completedSessions = (record.sessions || []).filter(s => s.completed);
  const pendingSessions = (record.sessions || []).filter(s => !s.completed);

  const isCompleted = Boolean(record.isCompleted || (targetMinutes > 0 && completedMinutes >= targetMinutes));

  const modeLabel = record.mode === 'hourly'
    ? 'Hour-wise (1 Hour)'
    : record.pomodoroOption === 'custom'
      ? `Pomodoro (${record.customPomodoroMinutes}m)`
      : `Pomodoro (${record.pomodoroOption}m)`;

  return (
    <div className="dashboard-summary-card">
      <div className="dashboard-top-row">
        <div className="date-display-group">
          <span className="dashboard-date-label">Today</span>
          <h2 className="dashboard-date-value">{formatDisplayDate(dateStr)}</h2>
        </div>

        {isCompleted && (
          <div className="target-achieved-badge">
            <CheckCircle2 className="icon-xs text-success" />
            <span>Target Achieved</span>
          </div>
        )}
      </div>

      <div className="dashboard-metrics-grid">
        {/* Metric 1: Study Target */}
        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-label">Target</span>
            <button
              type="button"
              className="btn-edit-target"
              onClick={onOpenEditTarget}
              title="Edit today's target"
            >
              <Edit3 className="icon-xs" />
              <span>Edit</span>
            </button>
          </div>
          <div className="metric-value">
            {targetHours} <span className="metric-unit">{targetHours === 1 ? 'Hour' : 'Hours'}</span>
          </div>
          <div className="metric-subtext">{modeLabel}</div>
        </div>

        {/* Metric 2: Completed Duration */}
        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-label">Completed</span>
          </div>
          <div className="metric-value text-accent">
            {formatDuration(completedMinutes)}
          </div>
          <div className="metric-subtext">
            {completedSessions.length} {completedSessions.length === 1 ? 'session' : 'sessions'} done
          </div>
        </div>

        {/* Metric 3: Remaining Duration */}
        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-label">Remaining</span>
          </div>
          <div className="metric-value">
            {formatDuration(remainingMinutes)}
          </div>
          <div className="metric-subtext">
            {pendingSessions.length} {pendingSessions.length === 1 ? 'session' : 'sessions'} pending
          </div>
        </div>

        {/* Metric 4: Sessions Status */}
        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-label">Sessions</span>
          </div>
          <div className="metric-value">
            {completedSessions.length} <span className="metric-divider">/</span> {(record.sessions || []).length}
          </div>
          <div className="metric-subtext">
            {isCompleted ? 'All completed' : `${pendingSessions.length} remaining`}
          </div>
        </div>
      </div>
    </div>
  );
}
