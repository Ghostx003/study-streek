// LocalStorage persistence manager with safety checks

const STORAGE_KEY = 'study_streak_app_state_v1';

export function loadStoredState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load local state:', err);
  }
  return null;
}

export function saveStoredState(state) {
  if (typeof window === 'undefined') return;
  try {
    const stateToSave = {
      ...state,
      lastModified: state.lastModified || Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (err) {
    console.error('Failed to save local state:', err);
  }
}
