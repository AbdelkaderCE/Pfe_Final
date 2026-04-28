/*
  Intent: Navigation teaches people how to think about the space they're in.
          A teacher at 7am sees Attendance. A student doesn't.
          Sidebar is part of the app — same canvas bg, subtle border separation.
  Palette: canvas bg. brand-light for active. surface-200 for hover.
  Depth: border-edge on the right edge — the border is enough.
  Surfaces: canvas (same as content). No "sidebar world."
  Typography: 14px/500 for nav items. 11px/600 uppercase for section labels.
  Spacing: 4px base. 12px item padding. 4px gap between items.
*/

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/* ── SVG Icon Components (stroke 1.5, 20×20) ──────────────── */
const icons = {
  '/dashboard': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  '/dashboard/actualites': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
    </svg>
  ),
  '/dashboard/pfe-workspace': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25h7.5m-7.5 3.75h3.75m-3.75 3.75h7.5" />
    </svg>
  ),
  '/dashboard/projects': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  ),
  '/dashboard/documents': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  '/dashboard/remise-copies': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12h6m-6 3h4.5M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75h3.75m-3.75 3h7.5" />
    </svg>
  ),
  '/dashboard/disciplinary': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286zM12 15.75h.008v.008H12v-.008z" />
    </svg>
  ),
  '/dashboard/requests': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z" />
    </svg>
  ),
  '/dashboard/specialite-choice': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  '/dashboard/settings': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  '/dashboard/support': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  ),
  '/admin': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75m-9.75 6h9.75M3.75 6h.008v.008H3.75V6zm0 6h.008v.008H3.75V12zm0 6h.008v.008H3.75V18z" />
    </svg>
  ),
  '/dashboard/admin/academic/management': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9A2.25 2.25 0 0118.75 18.75H5.25A2.25 2.25 0 013 16.5v-9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 9.75h9m-9 3h6" />
    </svg>
  ),
  '/dashboard/admin/academic/assignments': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5V6a3 3 0 10-6 0v1.5m6 0h1.5A1.5 1.5 0 0121 9v9.75a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 18.75V9a1.5 1.5 0 011.5-1.5H6m12 0H6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l1.5 1.5 4.5-4.5" />
    </svg>
  ),
  '/dashboard/admin/site-settings': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  '/dashboard/admin/users': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a3 3 0 110-6 3 3 0 010 6z" />
    </svg>
  ),
  '/dashboard/admin/analytics': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 15l3-3 3 3 5-5" />
    </svg>
  ),
  '/dashboard/student/history': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  '/dashboard/teacher/history': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  '/dashboard/admin/history': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  '/dashboard/admin/affectation': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
  ),
};

const fallbackIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25h7.5m-7.5 3.75h7.5m-7.5 3.75h5.25" />
  </svg>
);

/* ── Section labels for grouping (i18n keys) ─────────────────── */
const SECTIONS = {
  '/dashboard':                null,
  '/dashboard/actualites':     null,
  '/dashboard/projects':       'sections.academic',
  '/dashboard/documents':      null,
  '/dashboard/disciplinary':   null,
  '/dashboard/requests':       null,
  '/dashboard/remise-copies':  null,
  '/dashboard/specialite-choice': 'sections.academic',
  '/dashboard/student/history': 'sections.academic',
  '/dashboard/teacher/history': 'sections.academic',
  '/dashboard/settings':       'sections.system',
  '/dashboard/support':        null,
  '/admin':                    'sections.system',
  '/dashboard/admin/analytics': 'sections.system',
  '/dashboard/admin/academic/management': 'sections.system',
  '/dashboard/admin/academic/assignments': 'sections.system',
  '/dashboard/admin/site-settings': 'sections.system',
  '/dashboard/admin/history': 'sections.system',
  '/dashboard/admin/affectation': 'sections.system',
};

function formatBadgeValue(count) {
  if (count > 99) {
    return '99+';
  }
  return String(count);
}

export default function Sidebar({ modules = [], open = false, onClose, onNavigate, activeKey, collapsed = false, onToggleCollapse }) {
  const { t } = useTranslation();
  let lastSection = null;

  /* Lock body scroll when mobile sidebar is open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Mobile scrim */}
      {open && (
        <div
          className="fixed inset-0 bg-black/25 z-40 lg:hidden transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 start-0 z-40 h-full
          bg-sidebar border-e border-sidebar-edge
          flex flex-col
          transition-all duration-200 ease-out
          lg:translate-x-0 rtl:lg:-translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0 rtl:-translate-x-0 w-64' : '-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:-translate-x-0'}
          ${collapsed ? 'lg:w-[68px]' : 'lg:w-64'}
        `}
      >
        {/* ── Brand header — aligns with topbar h-16 ─────────── */}
        <div className="h-16 px-4 flex items-center border-b border-sidebar-edge-subtle shrink-0">
          <div className={`flex items-center ${collapsed ? 'lg:justify-center lg:w-full' : 'gap-3'}`}>
            <img
              src="/Logo.png"
              alt="Ibn Khaldoun University"
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
            <div className={`${collapsed ? 'lg:hidden' : ''}`}>
              <p className="text-sm font-semibold text-ink leading-tight">{t('brand.name')}</p>
              <p className="text-xs text-ink-muted leading-tight">{t('brand.tagline')}</p>
            </div>
          </div>

          {/* Close — mobile only */}
          <button
            onClick={onClose}
            className="ms-auto lg:hidden p-1.5 rounded-md text-ink-tertiary hover:bg-sidebar-hover transition-colors duration-150"
            aria-label={t('sidebar.closeMenu')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Navigation ─────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <ul className="space-y-0.5">
            {modules.map((item) => {
              const isActive = item.path === activeKey;
              const section = SECTIONS[item.path];
              const showSection = section && section !== lastSection;
              const badgeCount = Number(item.badgeCount);
              const showBadge = Number.isFinite(badgeCount) && badgeCount > 0;
              const badgeValue = showBadge ? formatBadgeValue(badgeCount) : null;
              if (section) lastSection = section;

              return (
                <li key={item.path}>
                  {showSection && !collapsed && (
                    <p className="px-3 pt-5 pb-1.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                      {t(section)}
                    </p>
                  )}
                  {/* Separator dot when collapsed instead of section label */}
                  {showSection && collapsed && (
                    <div className="hidden lg:flex justify-center py-3">
                      <span className="w-1 h-1 rounded-full bg-sidebar-edge" />
                    </div>
                  )}
                  <button
                    onClick={() => onNavigate?.(item.path)}
                    title={collapsed ? item.name : undefined}
                    aria-label={showBadge ? `${item.name} (${badgeValue})` : item.name}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                      transition-colors duration-100
                      ${collapsed ? 'lg:justify-center lg:px-0' : 'lg:justify-between'}
                      ${isActive
                        ? 'bg-sidebar-active text-sidebar-active-text'
                        : 'text-ink-secondary hover:bg-sidebar-hover hover:text-ink'
                      }
                    `}
                  >
                    <span className={`flex items-center gap-3 min-w-0 ${collapsed ? 'lg:justify-center lg:w-full' : ''}`}>
                      <span className="relative w-5 h-5 shrink-0">
                        {icons[item.path] || fallbackIcon}
                        {collapsed && showBadge && (
                          <span className="hidden lg:inline-flex absolute -top-1.5 -end-2 min-w-[16px] h-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white">
                            {badgeValue}
                          </span>
                        )}
                      </span>
                      <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                    </span>
                    {!collapsed && showBadge && (
                      <span className="inline-flex min-w-[20px] h-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold leading-none text-white">
                        {badgeValue}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Collapse toggle — desktop only ─────────────────── */}
        <div className="hidden lg:flex px-3 py-2 border-t border-sidebar-edge-subtle shrink-0">
          <button
            onClick={onToggleCollapse}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
              text-ink-tertiary hover:text-ink-secondary hover:bg-sidebar-hover
              transition-colors duration-150
              ${collapsed ? 'justify-center px-0' : ''}
            `}
            title={collapsed ? t('topbar.expandSidebar') : t('topbar.collapseSidebar')}
            aria-label={collapsed ? t('topbar.expandSidebar') : t('topbar.collapseSidebar')}
          >
            <svg className={`w-5 h-5 shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
            <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{t('sidebar.collapse')}</span>
          </button>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-sidebar-edge-subtle shrink-0">
          <p className={`text-[11px] text-ink-muted ${collapsed ? 'lg:hidden' : ''}`}>{t('sidebar.copyright')}</p>
          {collapsed && (
            <p className="hidden lg:block text-[10px] text-ink-muted text-center">© 2026</p>
          )}
        </div>
      </aside>
    </>
  );
}
