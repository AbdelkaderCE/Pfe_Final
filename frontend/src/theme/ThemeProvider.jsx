/*
  ThemeProvider — manages mode, accent, and global sidebar color.
  Persists to localStorage. Applies class + data-attributes on <html>.
  Any component can read/change theme via useTheme().
*/

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const MODES = ['light', 'dark'];
const ACCENTS = ['blue', 'emerald', 'violet', 'amber', 'rose'];
const SIDEBAR_COLORS = ['slate', 'blue', 'indigo', 'emerald', 'rose'];

const STORAGE_KEY_MODE = 'ik-theme-mode';
const STORAGE_KEY_ACCENT = 'ik-theme-accent';
const STORAGE_KEY_SIDEBAR_COLOR = 'themeColor';

const ThemeContext = createContext(undefined);

function getInitialMode() {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY_MODE);
  if (stored && MODES.includes(stored)) return stored;
  // Respect OS preference
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

function getInitialAccent() {
  if (typeof window === 'undefined') return 'blue';
  const stored = localStorage.getItem(STORAGE_KEY_ACCENT);
  if (stored && ACCENTS.includes(stored)) return stored;
  return 'blue';
}

function getInitialSidebarColor() {
  if (typeof window === 'undefined') return 'slate';
  const stored = localStorage.getItem(STORAGE_KEY_SIDEBAR_COLOR);
  if (stored && SIDEBAR_COLORS.includes(stored)) return stored;
  return 'slate';
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(getInitialMode);
  const [accent, setAccentState] = useState(getInitialAccent);
  const [sidebarColor, setSidebarColorState] = useState(getInitialSidebarColor);

  // Apply mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    localStorage.setItem(STORAGE_KEY_MODE, mode);
  }, [mode]);

  // Apply accent data-attribute to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-accent', accent);
    localStorage.setItem(STORAGE_KEY_ACCENT, accent);
  }, [accent]);

  // Apply sidebar color data-attribute to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-sidebar-color', sidebarColor);
    localStorage.setItem(STORAGE_KEY_SIDEBAR_COLOR, sidebarColor);
  }, [sidebarColor]);

  const setMode = useCallback((m) => {
    if (MODES.includes(m)) setModeState(m);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setAccent = useCallback((a) => {
    if (ACCENTS.includes(a)) setAccentState(a);
  }, []);

  const setSidebarColor = useCallback((color) => {
    if (SIDEBAR_COLORS.includes(color)) setSidebarColorState(color);
  }, []);

  const value = {
    mode,
    accent,
    sidebarColor,
    setMode,
    toggleMode,
    setAccent,
    setSidebarColor,
    modes: MODES,
    accents: ACCENTS,
    sidebarColors: SIDEBAR_COLORS,
    isDark: mode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

export default ThemeProvider;
