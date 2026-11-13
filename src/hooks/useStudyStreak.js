import { useState, useEffect, useCallback, useRef } from 'react';
import { getLocalDateString, formatTimestamp } from '../utils/dateUtils';
import { generateSessions, recalculateSessions } from '../utils/sessionGenerator';
import { loadStoredState, saveStoredState } from '../utils/storage';
import { apiRequest } from '../utils/apiClient';

export function useStudyStreak() {
  const [currentDateStr, setCurrentDateStr] = useState(() => getLocalDateString());
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState({});
  const [preferences, setPreferences] = useState({ theme: 'dark' });
  const [syncId, setSyncId] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [isInitialized, setIsInitialized] = useState(false);

  const isApplyingRemoteRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  // Keep a ref of state to avoid stale closures in sync intervals
  const stateRef = useRef({ todayRecord, history, preferences, syncId });
  useEffect(() => {
    stateRef.current = { todayRecord, history, preferences, syncId };
  }, [todayRecord, history, preferences, syncId]);

  // Load initial state and handle daily rollover
  useEffect(() => {
    const today = getLocalDateString();
    setCurrentDateStr(today);

    const stored = loadStoredState();
    if (stored) {
      let activeToday = stored.today || null;
      const updatedHistory = { ...(stored.history || {}) };

      // Check if stored today is from a previous calendar day
      if (activeToday && activeToday.date && activeToday.date < today) {
        // Archive previous day into history
        const prevDate = activeToday.date;
        const isSuccess = Boolean(
          activeToday.isCompleted ||
          (activeToday.targetDurationMinutes > 0 &&
           activeToday.completedDurationMinutes >= activeToday.targetDurationMinutes)
        );

        updatedHistory[prevDate] = {
          ...activeToday,
          isCompleted: isSuccess,
          updatedAt: new Date().toISOString()
        };

        // Reset today to fresh for the new day
        activeToday = null;
      }

      setTodayRecord(activeToday);
      setHistory(updatedHistory);
      if (stored.preferences) setPreferences(stored.preferences);
      if (stored.syncId) setSyncId(stored.syncId);
      if (stored.lastSyncedAt) setLastSyncedAt(stored.lastSyncedAt);
    }

    setIsInitialized(true);
  }, []);

  // Check for day rollover periodically (e.g. at midnight)
  useEffect(() => {
    const interval = setInterval(() => {
      const nowDay = getLocalDateString();
      if (nowDay !== currentDateStr) {
        // Day changed! Archive today and start fresh
        setCurrentDateStr(nowDay);
        setTodayRecord(currentToday => {
          if (currentToday && currentToday.date < nowDay) {
            setHistory(prevHistory => {
              const isSuccess = Boolean(
                currentToday.isCompleted ||
                (currentToday.targetDurationMinutes > 0 &&
                 currentToday.completedDurationMinutes >= currentToday.targetDurationMinutes)
              );
              return {
                ...prevHistory,
                [currentToday.date]: {
                  ...currentToday,
                  isCompleted: isSuccess,
                  updatedAt: new Date().toISOString()
                }
              };
            });
            return null; // Prompt for new day's target
          }
          return currentToday;
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [currentDateStr]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isInitialized) return;

    const payload = {
      version: 1,
      currentDate: currentDateStr,
      today: todayRecord,
      history,
      preferences,
      syncId,
      lastSyncedAt,
      lastModified: Date.now()
    };

    saveStoredState(payload);

    // If syncId exists and not currently applying remote state, debounce background sync
    if (syncId && !isApplyingRemoteRef.current) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        triggerBackgroundSync(payload);
      }, 800);
    }
  }, [todayRecord, history, preferences, syncId, currentDateStr, isInitialized]);

  // Background sync helper using robust apiClient
  const triggerBackgroundSync = useCallback(async (stateToSync) => {
    if (!stateToSync.syncId) return;
    try {
      setSyncStatus('syncing');
      const res = await apiRequest('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncId: stateToSync.syncId,
          state: stateToSync,
          lastModified: stateToSync.lastModified
        })
      });

      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          if (!data.updated && data.state) {
            // Server had newer state! Update local state to match server
            applyRemoteState(data.state);
          }
          setLastSyncedAt(Date.now());
          setSyncStatus('synced');
        }
      }
    } catch {
      setSyncStatus('error');
    }
  }, []);

  // Apply remote state from synchronization without triggering infinite loop
  const applyRemoteState = useCallback((remote) => {
    if (!remote) return;
    isApplyingRemoteRef.current = true;
    if (remote.today) setTodayRecord(remote.today);
    if (remote.history) setHistory(remote.history);
    if (remote.preferences) setPreferences(remote.preferences);
    if (remote.syncId) setSyncId(remote.syncId);
    setLastSyncedAt(Date.now());
    setSyncStatus('synced');

    setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, 1000);
  }, []);

  // 1. Establish today's target and mode
  const setDailyTarget = useCallback(({
    targetHours,
    mode,
    pomodoroOption,
    customPomodoroMinutes
  }) => {
    const today = getLocalDateString();
    const hours = Number(targetHours);
    const totalMinutes = Math.round(hours * 60);

    const generated = generateSessions({
      targetHours: hours,
      mode,
      pomodoroOption,
      customPomodoroMinutes
    });

    const newRecord = {
      date: today,
      targetHours: hours,
      mode,
      pomodoroOption: mode === 'pomodoro' ? pomodoroOption : undefined,
      customPomodoroMinutes: mode === 'pomodoro' && pomodoroOption === 'custom' ? customPomodoroMinutes : undefined,
      sessions: generated,
      completedDurationMinutes: 0,
      targetDurationMinutes: totalMinutes,
      isCompleted: false,
      completedAt: null,
      updatedAt: new Date().toISOString()
    };

    setTodayRecord(newRecord);
  }, []);

  // 2. Edit today's target (Preserves already completed sessions & recalculates)
  const editDailyTarget = useCallback(({
    newTargetHours,
    mode,
    pomodoroOption,
    customPomodoroMinutes
  }) => {
    setTodayRecord(prev => {
      if (!prev) return prev;

      const effectiveMode = mode || prev.mode || 'hourly';
      const effectivePomOpt = pomodoroOption || prev.pomodoroOption || '25';
      const effectiveCustomPom = customPomodoroMinutes || prev.customPomodoroMinutes || 30;

      const recalculated = recalculateSessions({
        existingSessions: prev.sessions || [],
        newTargetHours,
        mode: effectiveMode,
        pomodoroOption: effectivePomOpt,
        customPomodoroMinutes: effectiveCustomPom
      });

      return {
        ...prev,
        targetHours: Number(newTargetHours),
        mode: effectiveMode,
        pomodoroOption: effectiveMode === 'pomodoro' ? effectivePomOpt : undefined,
        customPomodoroMinutes: effectiveMode === 'pomodoro' && effectivePomOpt === 'custom' ? effectiveCustomPom : undefined,
        sessions: recalculated.sessions,
        completedDurationMinutes: recalculated.completedDurationMinutes,
        targetDurationMinutes: recalculated.targetDurationMinutes,
        isCompleted: recalculated.isCompleted,
        completedAt: recalculated.isCompleted ? (prev.completedAt || new Date().toISOString()) : null,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  // 3. Toggle session completion
  const toggleSession = useCallback((sessionId) => {
    setTodayRecord(prev => {
      if (!prev || !prev.sessions) return prev;

      const targetSession = prev.sessions.find(s => s.id === sessionId);
      if (!targetSession) return prev;

      const willBeCompleted = !targetSession.completed;
      const nowIso = new Date().toISOString();
      const nowFormatted = formatTimestamp(nowIso);

      const updatedSessions = prev.sessions.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            completed: willBeCompleted,
            completedAt: willBeCompleted ? nowIso : null,
            completedTimeFormatted: willBeCompleted ? nowFormatted : null
          };
        }
        return s;
      });

      // Split into pending and completed
      const pendingList = updatedSessions.filter(s => !s.completed);
      const completedList = updatedSessions.filter(s => s.completed);

      // Rule: "Move the completed session to the bottom of the active session list."
      // Maintain order: pending sessions at the top, completed sessions at the bottom.
      const orderedSessions = [...pendingList, ...completedList];

      const completedMinutes = completedList.reduce((acc, s) => acc + s.durationMinutes, 0);
      const isTargetAchieved = completedMinutes >= prev.targetDurationMinutes;

      return {
        ...prev,
        sessions: orderedSessions,
        completedDurationMinutes: completedMinutes,
        isCompleted: isTargetAchieved,
        completedAt: isTargetAchieved ? (prev.completedAt || nowIso) : null,
        updatedAt: nowIso
      };
    });
  }, []);

  // Toggle historical day attendance
  const toggleHistoricalDay = useCallback((dateStr) => {
    const today = getLocalDateString();
    if (dateStr === today) {
      setTodayRecord(prev => {
        if (!prev) return prev;
        const newCompleted = !prev.isCompleted;
        return {
          ...prev,
          isCompleted: newCompleted,
          updatedAt: new Date().toISOString()
        };
      });
      return;
    }

    setHistory(prev => {
      const existing = prev[dateStr];
      const nowIso = new Date().toISOString();
      if (existing) {
        return {
          ...prev,
          [dateStr]: {
            ...existing,
            isCompleted: !existing.isCompleted,
            updatedAt: nowIso
          }
        };
      } else {
        // Create completed attendance record for that date
        return {
          ...prev,
          [dateStr]: {
            date: dateStr,
            targetHours: 6,
            mode: 'hourly',
            sessions: [],
            completedDurationMinutes: 360,
            targetDurationMinutes: 360,
            isCompleted: true,
            completedAt: nowIso,
            updatedAt: nowIso
          }
        };
      }
    });
  }, []);

  // Theme preference
  const toggleTheme = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  }, []);

  // Set sync connection
  const updateSyncConnection = useCallback((newSyncId, remoteState) => {
    setSyncId(newSyncId);
    if (remoteState) {
      applyRemoteState(remoteState);
    }
  }, [applyRemoteState]);

  return {
    currentDateStr,
    todayRecord,
    history,
    preferences,
    syncId,
    lastSyncedAt,
    syncStatus,
    setDailyTarget,
    editDailyTarget,
    toggleSession,
    toggleHistoricalDay,
    toggleTheme,
    updateSyncConnection,
    applyRemoteState,
    isInitialized
  };
}
