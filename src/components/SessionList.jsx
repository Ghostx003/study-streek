import { SessionCard } from './SessionCard';

export function SessionList({ sessions = [], onToggleSession }) {
  const pendingSessions = sessions.filter(s => !s.completed);
  const completedSessions = sessions.filter(s => s.completed);

  return (
    <div className="sessions-container">
      {/* Pending Sessions Section */}
      {pendingSessions.length > 0 && (
        <div className="sessions-section">
          <div className="sessions-section-header">
            <span className="sessions-section-title">Active Sessions</span>
            <span className="sessions-count-badge">{pendingSessions.length}</span>
          </div>
          <div className="sessions-list">
            {pendingSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onToggle={onToggleSession}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Sessions Section */}
      {completedSessions.length > 0 && (
        <div className="sessions-section completed-section mt-4">
          <div className="sessions-section-header">
            <span className="sessions-section-title">Completed Sessions</span>
            <span className="sessions-count-badge completed-badge">{completedSessions.length}</span>
          </div>
          <div className="sessions-list">
            {completedSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onToggle={onToggleSession}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
