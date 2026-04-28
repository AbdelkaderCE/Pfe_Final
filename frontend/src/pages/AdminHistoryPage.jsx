/*
  AdminHistoryPage — Admin view of any student's or teacher's activity history.
  Left column: tabbed user picker (Students / Teachers) with search.
  Right column: full StudentHistoryPage or TeacherHistoryPage for the selected user.
*/

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, User, GraduationCap, UserCog } from 'lucide-react';
import request from '../services/api';
import StudentHistoryPage from './StudentHistoryPage';
import TeacherHistoryPage from './TeacherHistoryPage';

const ROLE_FILTERS = {
  student: { label: 'Students', role: 'etudiant', icon: GraduationCap },
  teacher: { label: 'Teachers', role: 'enseignant', icon: UserCog },
};

function matchesUser(user, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    String(user.prenom || '').toLowerCase().includes(needle) ||
    String(user.nom || '').toLowerCase().includes(needle) ||
    String(user.email || '').toLowerCase().includes(needle)
  );
}

export default function AdminHistoryPage() {
  const [tab, setTab] = useState('student');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef(null);
  const [users, setUsers] = useState({ student: [], teacher: [] });
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const { role } = ROLE_FILTERS[tab];

    (async () => {
      if (users[tab].length > 0) return;
      try {
        setLoadingList(true);
        setListError('');
        const res = await request(`/api/v1/admin/users?role=${role}&limit=500`);
        if (cancelled) return;
        const items = Array.isArray(res?.data) ? res.data : [];
        setUsers((prev) => ({ ...prev, [tab]: items }));
      } catch (err) {
        if (!cancelled) setListError(err?.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, users]);

  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  const filteredUsers = useMemo(
    () => users[tab].filter((u) => matchesUser(u, debouncedSearch)),
    [users, tab, debouncedSearch]
  );

  const endpoint = selectedId
    ? tab === 'student'
      ? `/api/v1/history/admin/student/${selectedId}`
      : `/api/v1/history/admin/teacher/${selectedId}`
    : null;

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink">User Activity History</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Browse and inspect activity for any student or teacher on the platform.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-edge bg-surface p-3 shadow-sm">
          <div className="flex gap-1 rounded-lg bg-surface-200 p-1">
            {Object.entries(ROLE_FILTERS).map(([key, conf]) => {
              const Icon = conf.icon;
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTab(key);
                    setSelectedId(null);
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-surface text-ink shadow-sm'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  {conf.label}
                </button>
              );
            })}
          </div>

          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary"
              strokeWidth={2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-lg border border-edge bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-tertiary focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="mt-3 max-h-[65vh] overflow-y-auto pr-1">
            {loadingList && (
              <p className="px-3 py-6 text-center text-xs text-ink-tertiary">Loading…</p>
            )}
            {listError && !loadingList && (
              <p className="px-3 py-6 text-center text-xs text-rose-600">{listError}</p>
            )}
            {!loadingList && !listError && filteredUsers.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-ink-tertiary">
                No {ROLE_FILTERS[tab].label.toLowerCase()} found.
              </p>
            )}

            <ul className="space-y-1">
              {filteredUsers.map((u) => {
                const active = selectedId === u.id;
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(u.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                        active
                          ? 'bg-brand/10 text-ink ring-1 ring-brand/30'
                          : 'hover:bg-surface-200'
                      }`}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-200 text-ink-secondary">
                        <User className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {(u.prenom || '') + ' ' + (u.nom || '')}
                        </span>
                        <span className="block truncate text-xs text-ink-tertiary">
                          {u.email}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <section className="min-w-0 rounded-2xl border border-edge bg-surface shadow-sm">
          {!selectedId && (
            <div className="flex h-full min-h-[50vh] items-center justify-center p-10 text-center">
              <div>
                <p className="text-sm font-medium text-ink">Select a user</p>
                <p className="mt-1 text-xs text-ink-tertiary">
                  Pick a {tab} from the list to view their full history.
                </p>
              </div>
            </div>
          )}

          {selectedId && tab === 'student' && (
            <StudentHistoryPage key={`s-${selectedId}`} endpoint={endpoint} />
          )}
          {selectedId && tab === 'teacher' && (
            <TeacherHistoryPage key={`t-${selectedId}`} endpoint={endpoint} />
          )}
        </section>
      </div>
    </div>
  );
}
