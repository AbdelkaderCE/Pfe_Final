/*
  Intent: Topbar grounds the user — where they are, who they are, what role they're in.
          It never competes with content. It frames.
  Palette: canvas bg, same as sidebar. edge border-bottom for separation.
  Depth: border only. No shadow on topbar.
  Surfaces: canvas base. surface-200 for toggle well. surface for dropdown (level 2).
  Typography: 16px/600 for page title. 14px/500 for toggle. 14px/400 for dropdown.
  Spacing: 4px base. h-16 aligns with sidebar header.
*/

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';
import ThemeSwitcher from '../../../theme/ThemeSwitcher';
import { alertsAPI, resolveMediaUrl } from '../../../services/api';

/* ── Page titles mapped to routes (i18n keys) ─────────────────── */
const PAGE_TITLE_KEYS = {
  '/dashboard':                'nav.dashboard',
  '/dashboard/actualites':     'nav.actualites',
  '/dashboard/projects':       'nav.projects',
  '/dashboard/ai':             'nav.ai',
  '/dashboard/documents':      'nav.documents',
  '/dashboard/disciplinary':   'nav.disciplinary',
  '/dashboard/requests':       'nav.requests',
  '/dashboard/settings':       'nav.settings',
  '/dashboard/support':        'nav.support',
  '/admin':                    'nav.adminHub',
  '/dashboard/profile':        'nav.profile',
  '/dashboard/admin/users':    'nav.userManagement',
  '/dashboard/admin/academic/management': 'nav.academicStructure',
  '/dashboard/admin/academic/assignments': 'nav.academicAssignments',
  '/dashboard/admin/site-settings': 'nav.siteConfiguration',
};

export default function Topbar({ role = 'student', user, onLogout, onHamburger, onNavigate, activeKey = '/dashboard', sidebarCollapsed = false, onToggleSidebar }) {
  const { toggleMode, isDark } = useTheme();
  const { t } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState('');
  const dropdownRef = useRef(null);
  const alertsRef = useRef(null);

  /* Derive display values from the real user object */
  const initials = user
    ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase()
    : role === 'student' ? 'ST' : 'PR';
  const displayName = user
    ? `${user.prenom} ${user.nom}`
    : role === 'student' ? 'Student' : 'Teacher';
  const displayEmail = user?.email || `${role}@univ-ibn-khaldoun.dz`;
  const roleBadge = (user?.roles?.[0] || role)?.replace(/_/g, ' ');
  const photoUrl = resolveMediaUrl(user?.photo);

  const unreadCount = alerts.reduce((count, alert) => {
    if (alert?.isRead) {
      return count;
    }
    return count + 1;
  }, 0);

  /* Close on outside click */
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen, dropdownRef]);

  useEffect(() => {
    if (!alertsOpen) return;
    const handler = (e) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target)) {
        setAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [alertsOpen, alertsRef]);

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      setAlerts([]);
      setAlertsError('');
      return undefined;
    }

    const loadAlerts = async (withLoader = false) => {
      if (withLoader) {
        setAlertsLoading(true);
      }

      try {
        const response = await alertsAPI.getMine({ limit: 12 });
        if (!cancelled) {
          setAlerts(Array.isArray(response?.data) ? response.data : []);
          setAlertsError('');
        }
      } catch (error) {
        if (!cancelled) {
          setAlertsError(error?.message || 'Failed to load alerts.');
        }
      } finally {
        if (!cancelled) {
          setAlertsLoading(false);
        }
      }
    };

    loadAlerts(true);
    const intervalId = window.setInterval(() => loadAlerts(false), 45000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user?.id]);

  const handleMarkAlertAsRead = async (alertId) => {
    try {
      await alertsAPI.markAsRead(alertId);
      setAlerts((current) =>
        current.map((alert) => (alert.id === alertId ? { ...alert, isRead: true } : alert))
      );
    } catch {
      // Best-effort UI update; failure keeps alert unread.
    }
  };

  const title = t(PAGE_TITLE_KEYS[activeKey] || 'nav.dashboard');

  return (
    <header className="h-16 bg-canvas border-b border-edge flex items-center justify-between px-4 lg:px-6 shrink-0">

      {/* ── Left: hamburger / sidebar toggle + page title ──── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onHamburger}
          className="lg:hidden p-2 -ms-2 rounded-md text-ink-tertiary hover:text-ink-secondary hover:bg-surface-200 transition-colors duration-150"
          aria-label={t('topbar.openMenu')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 -ms-2 rounded-md text-ink-tertiary hover:text-ink-secondary hover:bg-surface-200 transition-colors duration-150"
          aria-label={sidebarCollapsed ? t('topbar.expandSidebar') : t('topbar.collapseSidebar')}
          title={sidebarCollapsed ? t('topbar.expandSidebar') : t('topbar.collapseSidebar')}
        >
          <svg className={`w-5 h-5 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180 rtl:-rotate-180' : 'rtl:rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </button>

        <h1 className="text-base font-semibold text-ink tracking-tight">{title}</h1>
      </div>

      {/* ── Right: role toggle + profile ─────────────────────── */}
      <div className="flex items-center gap-3">

        {/* Theme mode toggle — sun/moon */}
        <button
          onClick={toggleMode}
          className="p-2 rounded-md text-ink-tertiary hover:text-ink-secondary hover:bg-surface-200 transition-colors duration-150"
          aria-label={isDark ? t('topbar.lightMode') : t('topbar.darkMode')}
          title={isDark ? t('topbar.lightMode') : t('topbar.darkMode')}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>

        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => {
              setAlertsOpen((value) => !value);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-md text-ink-tertiary hover:text-ink-secondary hover:bg-surface-200 transition-colors duration-150"
            aria-label="Open alerts"
            title="Alerts"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.05-.05.7a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {alertsOpen && (
            <div className="absolute end-0 mt-1 w-96 max-w-[calc(100vw-2rem)] bg-surface rounded-lg shadow-card border border-edge py-1 z-50">
              <div className="px-4 py-3 border-b border-edge-subtle flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">Alerts</p>
                <p className="text-xs text-ink-tertiary">Unread: {unreadCount}</p>
              </div>

              {alertsLoading ? (
                <div className="px-4 py-6 text-sm text-ink-tertiary">Loading alerts...</div>
              ) : alertsError ? (
                <div className="px-4 py-6 text-sm text-danger">{alertsError}</div>
              ) : alerts.length === 0 ? (
                <div className="px-4 py-6 text-sm text-ink-tertiary">No alerts yet.</div>
              ) : (
                <div className="max-h-96 overflow-y-auto py-1">
                  {alerts.map((alert) => {
                    const createdAt = alert?.createdAt ? new Date(alert.createdAt) : null;
                    const createdLabel = createdAt && !Number.isNaN(createdAt.getTime())
                      ? createdAt.toLocaleString()
                      : '-';

                    return (
                      <div
                        key={alert.id}
                        className={`px-4 py-3 border-b last:border-b-0 border-edge-subtle ${alert.isRead ? 'bg-surface' : 'bg-brand/5'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{alert.title}</p>
                            <p className="mt-1 text-xs text-ink-secondary whitespace-pre-wrap break-words">{alert.message}</p>
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-tertiary">
                              <span className="uppercase tracking-wide">{alert.type}</span>
                              <span>•</span>
                              <span>{createdLabel}</span>
                            </div>
                          </div>

                          {!alert.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAlertAsRead(alert.id)}
                              className="shrink-0 rounded-md border border-edge px-2 py-1 text-[11px] font-medium text-ink-secondary hover:bg-surface-200"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role badge */}
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md bg-brand-light text-brand text-xs font-semibold capitalize tracking-wide">
          {roleBadge}
        </span>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-200 transition-colors duration-150"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover border border-edge"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/Logo.png';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-ink-secondary max-w-[120px] truncate">
              {displayName}
            </span>
            <svg className="w-3.5 h-3.5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Dropdown — elevation level 2 */}
          {profileOpen && (
            <div className="absolute end-0 mt-1 w-56 bg-surface rounded-lg shadow-card border border-edge py-1 z-50">
              <div className="px-4 py-3 border-b border-edge-subtle">
                <p className="text-sm font-medium text-ink">
                  {displayName}
                </p>
                <p className="text-xs text-ink-tertiary truncate">
                  {displayEmail}
                </p>
              </div>

              <div className="py-1">
                <DropdownItem label={t('nav.profile')} onClick={() => { onNavigate?.('/dashboard/profile'); setProfileOpen(false); }} icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                } />
                <DropdownItem label={t('nav.settings')} onClick={() => { onNavigate?.('/dashboard/settings'); setProfileOpen(false); }} icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                } />
              </div>

              <div className="border-t border-edge-subtle px-4 py-3">
                <ThemeSwitcher />
              </div>

              <div className="border-t border-edge-subtle py-1">
                <DropdownItem label={t('topbar.signOut')} variant="danger" onClick={() => { setProfileOpen(false); onLogout?.(); }} icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                } />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function DropdownItem({ label, icon, variant = 'default', onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-100
        ${variant === 'danger'
          ? 'text-danger hover:bg-danger/50'
          : 'text-ink-secondary hover:bg-surface-200 hover:text-ink'
        }
      `}
    >
      {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
