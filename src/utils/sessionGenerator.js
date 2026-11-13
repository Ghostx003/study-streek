// Session generation and target recalculation logic

export function generateSessions({
  targetHours,
  mode, // 'hourly' | 'pomodoro'
  pomodoroOption = '25', // '25' | '35' | '45' | 'custom'
  customPomodoroMinutes = 30
}) {
  const totalMinutes = Math.round(Number(targetHours) * 60);
  const sessions = [];

  if (mode === 'hourly') {
    const sessionDuration = 60; // 60 minutes
    const fullCount = Math.floor(totalMinutes / sessionDuration);
    const remainder = totalMinutes % sessionDuration;

    for (let i = 1; i <= fullCount; i++) {
      const numStr = String(i).padStart(2, '0');
      sessions.push({
        id: `session-${i}`,
        sessionNumber: i,
        durationMinutes: 60,
        title: `Study Session ${numStr} — 1 Hour`,
        completed: false,
        completedAt: null,
        completedTimeFormatted: null
      });
    }

    if (remainder > 0) {
      const nextNum = fullCount + 1;
      const numStr = String(nextNum).padStart(2, '0');
      sessions.push({
        id: `session-${nextNum}`,
        sessionNumber: nextNum,
        durationMinutes: remainder,
        title: `Study Session ${numStr} — ${remainder} Minutes`,
        completed: false,
        completedAt: null,
        completedTimeFormatted: null
      });
    }
  } else {
    // Pomodoro tracking
    let duration = 25;
    if (pomodoroOption === '35') duration = 35;
    else if (pomodoroOption === '45') duration = 45;
    else if (pomodoroOption === 'custom') {
      duration = Math.max(5, Math.round(Number(customPomodoroMinutes) || 30));
    }

    const fullCount = Math.floor(totalMinutes / duration);
    const remainder = totalMinutes % duration;

    for (let i = 1; i <= fullCount; i++) {
      const numStr = String(i).padStart(2, '0');
      sessions.push({
        id: `pomodoro-${i}`,
        sessionNumber: i,
        durationMinutes: duration,
        title: `Study Session ${numStr} — ${duration} Minutes`,
        completed: false,
        completedAt: null,
        completedTimeFormatted: null
      });
    }

    if (remainder > 0) {
      const nextNum = fullCount + 1;
      const numStr = String(nextNum).padStart(2, '0');
      sessions.push({
        id: `pomodoro-${nextNum}`,
        sessionNumber: nextNum,
        durationMinutes: remainder,
        title: `Study Session ${numStr} — ${remainder} Minutes`,
        completed: false,
        completedAt: null,
        completedTimeFormatted: null
      });
    }
  }

  return sessions;
}

// Recalculate sessions when target is updated during the day
// PRESERVES all completed sessions, timestamps, and order
export function recalculateSessions({
  existingSessions = [],
  newTargetHours,
  mode,
  pomodoroOption,
  customPomodoroMinutes
}) {
  const newTotalMinutes = Math.round(Number(newTargetHours) * 60);

  // Separate completed and pending sessions
  const completedSessions = existingSessions.filter(s => s.completed);
  const completedMinutes = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  // If completed time already covers or exceeds the new target
  if (completedMinutes >= newTotalMinutes) {
    return {
      sessions: completedSessions,
      completedDurationMinutes: completedMinutes,
      targetDurationMinutes: newTotalMinutes,
      isCompleted: true
    };
  }

  // Determine standard session duration based on mode
  let stepDuration = 60;
  if (mode === 'pomodoro') {
    if (pomodoroOption === '35') stepDuration = 35;
    else if (pomodoroOption === '45') stepDuration = 45;
    else if (pomodoroOption === 'custom') {
      stepDuration = Math.max(5, Math.round(Number(customPomodoroMinutes) || 30));
    } else {
      stepDuration = 25;
    }
  }

  const remainingNeeded = newTotalMinutes - completedMinutes;
  const newPendingSessions = [];

  let startSessionNumber = completedSessions.length + 1;
  const fullNewSessions = Math.floor(remainingNeeded / stepDuration);
  const remainder = remainingNeeded % stepDuration;

  for (let i = 0; i < fullNewSessions; i++) {
    const sessionNum = startSessionNumber + i;
    const numStr = String(sessionNum).padStart(2, '0');
    const title = mode === 'hourly' && stepDuration === 60
      ? `Study Session ${numStr} — 1 Hour`
      : `Study Session ${numStr} — ${stepDuration} Minutes`;

    newPendingSessions.push({
      id: `recalc-${Date.now()}-${sessionNum}`,
      sessionNumber: sessionNum,
      durationMinutes: stepDuration,
      title,
      completed: false,
      completedAt: null,
      completedTimeFormatted: null
    });
  }

  if (remainder > 0) {
    const sessionNum = startSessionNumber + fullNewSessions;
    const numStr = String(sessionNum).padStart(2, '0');
    newPendingSessions.push({
      id: `recalc-${Date.now()}-${sessionNum}-rem`,
      sessionNumber: sessionNum,
      durationMinutes: remainder,
      title: `Study Session ${numStr} — ${remainder} Minutes`,
      completed: false,
      completedAt: null,
      completedTimeFormatted: null
    });
  }

  // Combined sessions: pending first, then completed at bottom
  const allSessions = [...newPendingSessions, ...completedSessions];

  return {
    sessions: allSessions,
    completedDurationMinutes: completedMinutes,
    targetDurationMinutes: newTotalMinutes,
    isCompleted: completedMinutes >= newTotalMinutes && newPendingSessions.length === 0
  };
}
