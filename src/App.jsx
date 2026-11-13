import { useState, useEffect } from 'react';
import { useStudyStreak } from './hooks/useStudyStreak';
import { Header } from './components/Header';
import { DailyTargetSetup } from './components/DailyTargetSetup';
import { TargetEditModal } from './components/TargetEditModal';
import { Dashboard } from './components/Dashboard';
import { SessionList } from './components/SessionList';
import { CalendarSection } from './components/CalendarSection';
import { StatisticsSection } from './components/StatisticsSection';
import { SyncModal } from './components/SyncModal';
import { apiRequest } from './utils/apiClient';

export function App() {
  const {
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
    toggleTheme,
    updateSyncConnection,
    applyRemoteState,
    isInitialized
  } = useStudyStreak();

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Set HTML theme attribute
  useEffect(() => {
    const theme = preferences?.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, [preferences?.theme]);

  // Check URL parameters for auto-pairing (e.g. from mobile camera scan of QR link)
  useEffect(() => {
    if (!isInitialized) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const pairToken = params.get('pairToken');
      const code = params.get('code');

      if (pairToken || code) {
        // Auto-claim pairing
        apiRequest('/api/pair/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: pairToken,
            code,
            mobileState: {
              today: todayRecord,
              history,
              preferences,
              lastModified: Date.now()
            }
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.syncId) {
              updateSyncConnection(data.syncId, data.state);
              // Clean URL
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(() => {});
      }
    } catch {
      // ignore url parse errors
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return null;
  }

  const currentFullState = {
    today: todayRecord,
    history,
    preferences,
    syncId,
    lastModified: Date.now()
  };

  return (
    <div className="app-container">
      {/* App Header */}
      <Header
        theme={preferences?.theme || 'dark'}
        onToggleTheme={toggleTheme}
        onOpenSync={() => setIsSyncModalOpen(true)}
        syncStatus={syncStatus}
        syncId={syncId}
      />

      {/* Main Study Tracker Area */}
      <main className="main-content">
        {!todayRecord ? (
          <DailyTargetSetup onEstablishTarget={setDailyTarget} />
        ) : (
          <>
            <Dashboard
              record={todayRecord}
              onOpenEditTarget={() => setIsEditingTarget(true)}
            />

            <SessionList
              sessions={todayRecord.sessions || []}
              onToggleSession={toggleSession}
            />
          </>
        )}
      </main>

      {/* Calendar Section (Scroll down to access) */}
      <CalendarSection
        history={history}
        todayRecord={todayRecord}
      />

      {/* Consistency Statistics Section */}
      <StatisticsSection
        history={history}
        todayRecord={todayRecord}
      />

      {/* Edit Target Modal */}
      {isEditingTarget && todayRecord && (
        <TargetEditModal
          currentRecord={todayRecord}
          onUpdateTarget={editDailyTarget}
          onClose={() => setIsEditingTarget(false)}
        />
      )}

      {/* Device Sync Modal */}
      {isSyncModalOpen && (
        <SyncModal
          currentState={currentFullState}
          syncId={syncId}
          onSyncComplete={(newSyncId, remoteState) => {
            updateSyncConnection(newSyncId, remoteState);
          }}
          onClose={() => setIsSyncModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
