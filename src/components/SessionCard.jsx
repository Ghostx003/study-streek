import { Check } from 'lucide-react';

export function SessionCard({ session, onToggle }) {
  const isCompleted = session.completed;

  return (
    <div
      className={`session-card ${isCompleted ? 'session-completed' : 'session-pending'}`}
      onClick={() => onToggle(session.id)}
      role="checkbox"
      aria-checked={isCompleted}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggle(session.id);
        }
      }}
    >
      <div className="session-checkbox-wrapper">
        <div className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}>
          {isCompleted && <Check className="checkbox-check-icon" />}
        </div>
      </div>

      <div className="session-info">
        <div className={`session-title ${isCompleted ? 'text-strikethrough' : ''}`}>
          {session.title}
        </div>

        {isCompleted && session.completedTimeFormatted && (
          <div className="session-completion-time">
            Completed at {session.completedTimeFormatted}
          </div>
        )}
      </div>
    </div>
  );
}
