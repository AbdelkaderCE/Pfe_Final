/*
  Site-wide UI preferences (admin scope).
  Persisted in localStorage and applied as classes on <html>.
  Different from per-user accessibility (handled in SettingsPage).
  These flags are read by public + dashboard components to toggle features.
*/

const STORAGE_KEY = 'ik-site-ui-prefs-v1';

export const DEFAULT_UI_PREFS = {
  enableAnimations: true,
  showHeroSection: true,
  showStatsBanner: true,
  showActualites: true,
  compactSidebar: false,
};

const HTML_FLAG_CLASSES = {
  enableAnimations: { whenFalse: 'site-no-animations' },
  showHeroSection: { whenFalse: 'site-hide-hero' },
  showStatsBanner: { whenFalse: 'site-hide-stats' },
  showActualites: { whenFalse: 'site-hide-actualites' },
  compactSidebar: { whenTrue: 'site-compact-sidebar' },
};

export function readUIPrefs() {
  if (typeof window === 'undefined') return { ...DEFAULT_UI_PREFS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_UI_PREFS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_UI_PREFS, ...parsed };
  } catch {
    return { ...DEFAULT_UI_PREFS };
  }
}

export function writeUIPrefs(prefs) {
  if (typeof window === 'undefined') return;
  const merged = { ...DEFAULT_UI_PREFS, ...prefs };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  applyUIPrefsToDocument(merged);
}

export function applyUIPrefsToDocument(prefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  Object.entries(HTML_FLAG_CLASSES).forEach(([key, { whenTrue, whenFalse }]) => {
    const value = Boolean(prefs[key]);
    if (whenTrue) {
      root.classList.toggle(whenTrue, value);
    }
    if (whenFalse) {
      root.classList.toggle(whenFalse, !value);
    }
  });
}
