import { X, Check, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDisplayDate, formatDuration } from '../utils/dateUtils';

export function HistoryDayModal({ dayInfo, onClose, onToggleAttendance }) {
  if (!dayInfo) return null;

  const {
    dateStr,
    isCompleted,
    isToday,
    targetHours,
    completedDurationMinutes,
    targetDurationMinutes,
    mode,
    sessions = [],
    hasRecord
  } = dayInfo;

  const completedSessions = sessions.filter(s => s.completed);
  const incompleteSessions = sessions.filter(s => !s.completed);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card history-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="history-modal-title-group">
            <h3 className="modal-title">{formatDisplayDate(dateStr)}</h3>
            <div className="history-status-chip">
              {isCompleted ? (
                <span className="status-chip success">
                  <CheckCircle2 className="icon-xs" /> Completed
                </span>
              ) : isToday ? (
                <span className="status-chip neutral">
                  <Clock className="icon-xs" /> In Progress
                </span>
              ) : hasRecord ? (
                <span className="status-chip danger">
                  <XCircle className="icon-xs" /> Incomplete
                </span>
              ) : (
                <span className="status-chip muted">
                  Untracked
                </span>
              )}
            </div>
          </div>
          <button type="button" className="btn-icon-close" onClick={onClose} aria-label="Close">
            <X className="icon-sm" />
          </button>
        </div>

        <div className="history-details-body">
          {hasRecord ? (
            <>
              <div className="history-metric-grid">
                <div className="history-metric-item">
                  <span className="metric-label">Target</span>
                  <span className="history-metric-val">{targetHours || 0} Hours</span>
                </div>
                <div className="history-metric-item">
                  <span className="metric-label">Studied</span>
                  <span className="history-metric-val text-accent">
                    {formatDuration(completedDurationMinutes || 0)}
                  </span>
                </div>
                <div className="history-metric-item">
                  <span className="metric-label">Mode</span>
                  <span className="history-metric-val">
                    {mode === 'hourly' ? 'Hour-wise' : 'Pomodoro'}
                  </span>
                </div>
                <div className="history-metric-item">
                  <span className="metric-label">Sessions</span>
                  <span className="history-metric-val">
                    {completedSessions.length} done / {incompleteSessions.length} missed
                  </span>
                </div>
              </div>

              {sessions.length > 0 && (
                <div className="history-sessions-breakdown mt-4">
                  <div className="history-breakdown-title">Session Details</div>
                  <div className="history-sessions-list">
                    {sessions.map((s, idx) => (
                      <div
                        key={s.id || idx}
                        className={`history-session-row ${s.completed ? 'completed' : 'missed'}`}
                      >
                        <div className="history-session-left">
                          <span className={`status-indicator-dot ${s.completed ? 'success' : 'danger'}`}>
                            {s.completed ? <Check className="icon-tiny" /> : <X className="icon-tiny" />}
                          </span>
                          <span className={`history-session-name ${s.completed ? 'text-strikethrough' : ''}`}>
                            {s.title}
                          </span>
                        </div>
                        {s.completed && s.completedTimeFormatted && (
                          <span className="history-session-time">
                            {s.completedTimeFormatted}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="history-empty-state">
              <p>No study activity was recorded on this date.</p>
            </div>
          )}
        </div>

        <div className="modal-actions history-modal-actions">
          {onToggleAttendance && (
            <button
              type="button"
              className={`btn-toggle-attendance ${isCompleted ? 'btn-mark-incomplete' : 'btn-mark-complete'}`}
              onClick={() => {
                onToggleAttendance();
                onClose();
              }}
            >
              {isCompleted ? 'Mark as Incomplete ✕' : 'Mark as Completed ✓'}
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
