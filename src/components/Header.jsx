import { Sun, Moon, QrCode, RefreshCw, CheckCircle2 } from 'lucide-react';

export function Header({
  theme,
  onToggleTheme,
  onOpenSync,
  syncStatus,
  syncId
}) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo">
          <span className="brand-dot" />
          <h1 className="brand-title">STUDY STREAK</h1>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          onClick={onOpenSync}
          className="btn-sync"
          aria-label="Scan or connect device"
        >
          <QrCode className="icon-sm" />
          <span className="btn-sync-text">
            {syncId ? 'Connected' : 'Scan / Connect'}
          </span>
          {syncStatus === 'syncing' ? (
            <RefreshCw className="icon-xs animate-spin text-muted" />
          ) : syncId ? (
            <CheckCircle2 className="icon-xs text-success" />
          ) : null}
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="btn-theme-toggle"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="icon-sm" />
          ) : (
            <Moon className="icon-sm" />
          )}
        </button>
      </div>
    </header>
  );
}
