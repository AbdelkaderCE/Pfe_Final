/*
  Intent: A student or teacher viewing their own identity within the institution.
          Not a social profile — an academic identity card brought to screen.
          Three zones:
          1. Identity header — avatar, name, role, department (the seal of who you are)
          2. Academic information — enrollment details, supervisor, academic stats
          3. Contact & documents — email, phone, downloadable attestations
  Palette: canvas base, surface cards. Brand for identity accent, semantic for status.
  Depth: shadow-card + border-edge on all cards. No stacked shadows.
  Surfaces: canvas (page bg via layout), surface (card), surface-200 (stat wells).
  Typography: Inter. Section headings = text-base font-semibold. Body = text-sm.
  Spacing: 4px base. Cards p-6. gap-6 between sections.
*/

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import request, { resolveMediaUrl } from '../services/api';

/* ── Helpers ────────────────────────────────────────────────── */

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Info Row ──────────────────────────────────────────────── */
function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {icon && <span className="w-4 h-4 text-ink-tertiary shrink-0 mt-0.5">{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-sm font-medium text-ink mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

/* Helper: does the user have a student-like role? */
function isStudentRole(roles) {
  if (!roles) return true;
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr.some(r => ['STUDENT', 'etudiant'].includes(r.toUpperCase ? r.toUpperCase() : r));
}

/* ── Component ──────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user } = useAuth();
  const location = useLocation();
  const selectedStudentProfile = location.state?.selectedStudentProfile;
  const selectedStudentEtudiantId = Number(
    selectedStudentProfile?.studentEtudiantId || selectedStudentProfile?.etudiantId || 0
  );
  const [selectedStudentData, setSelectedStudentData] = useState(null);
  const [selectedStudentLoading, setSelectedStudentLoading] = useState(false);

  useEffect(() => {
    const etudiantId = selectedStudentEtudiantId;
    if (!etudiantId || !Number.isInteger(etudiantId) || etudiantId <= 0) {
      setSelectedStudentData(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setSelectedStudentLoading(true);
        const res = await request(`/api/v1/disciplinary/students/${etudiantId}/profile`);
        if (!cancelled) {
          setSelectedStudentData(res?.data || null);
        }
      } catch {
        if (!cancelled) {
          setSelectedStudentData(null);
        }
      } finally {
        if (!cancelled) {
          setSelectedStudentLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedStudentEtudiantId]);

  if (!user) return null;

  const student = isStudentRole(user.roles);
  const rolePretty = (user.roles?.[0] || 'etudiant').replace(/_/g, ' ');

  /* Student sub-record (populated by /auth/me → getUserById) */
  const dept = user.etudiant?.promo?.specialite?.filiere?.departement?.nom || '—';
  const spec = user.etudiant?.promo?.specialite?.nom || '—';
  const selectedUser = selectedStudentData?.user || null;
  const selectedDepartment = selectedStudentData?.promo?.specialite?.filiere?.departement?.nom || selectedStudentProfile?.department || '—';
  const selectedSpeciality = selectedStudentData?.promo?.specialite?.nom || '—';
  const isViewingSelectedStudent = Boolean(selectedStudentProfile);

  const pageUser = isViewingSelectedStudent && selectedUser ? selectedUser : user;
  const pageInitials = `${(pageUser?.prenom || '?')[0]}${(pageUser?.nom || '?')[0]}`.toUpperCase();
  const pagePhotoUrl = resolveMediaUrl(pageUser?.photo);
  const pageRolePretty = isViewingSelectedStudent ? 'etudiant' : rolePretty;
  const pageDepartment = isViewingSelectedStudent ? selectedDepartment : dept;
  const pageSpeciality = isViewingSelectedStudent ? selectedSpeciality : spec;

  return (
    <div className="space-y-6 max-w-3xl min-w-0">

      {/* ── Page Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-ink-tertiary">
            {isViewingSelectedStudent ? 'Student academic identity and personal information.' : 'Your academic identity and personal information.'}
          </p>
        </div>
        {/* Edit button */}
        <button className="px-4 py-2 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Edit profile
        </button>
      </div>

      {selectedStudentProfile ? (
        <div className="rounded-lg border border-edge-strong bg-brand/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Selected Student</p>
          <p className="mt-2 text-sm font-semibold text-ink">{selectedUser ? `${selectedUser.prenom || ''} ${selectedUser.nom || ''}`.trim() : (selectedStudentProfile.name || 'Unknown student')}</p>
          <p className="text-xs text-ink-tertiary">
            {(selectedStudentProfile.studentId || 'N/A')} · {(selectedStudentProfile.department || 'N/A')}
          </p>
          {selectedStudentLoading ? <p className="mt-2 text-xs text-ink-muted">Loading full student profile...</p> : null}
        </div>
      ) : null}

      {/* ── Identity Card ──────────────────────────────────── */}
      <div className="relative bg-surface rounded-lg border border-edge shadow-card">
        {/* Brand banner */}
        <div className="h-24 bg-gradient-to-r from-brand to-brand-hover relative rounded-t-lg overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 96" fill="none" preserveAspectRatio="xMidYMid slice">
              <circle cx="350" cy="20" r="80" fill="white" opacity="0.1" />
              <circle cx="50" cy="80" r="60" fill="white" opacity="0.05" />
            </svg>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar — overlaps the banner */}
          <div className="-mt-10 relative z-10">
            {pagePhotoUrl ? (
              <img
                src={pagePhotoUrl}
                alt={`${pageUser?.prenom || ''} ${pageUser?.nom || ''}`.trim() || 'Profile'}
                className="shrink-0 w-20 h-20 rounded-full object-cover border-4 border-surface shadow-card"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/Logo.png';
                }}
              />
            ) : (
              <div className="shrink-0 w-20 h-20 rounded-full bg-brand-light border-4 border-surface flex items-center justify-center shadow-card">
                <span className="text-2xl font-bold text-brand">{pageInitials}</span>
              </div>
            )}
          </div>
          {/* Name & role — below the avatar, clear of the banner */}
          <div className="mt-3 min-w-0">
            <h2 className="text-lg font-bold text-ink tracking-tight">
              {pageUser?.prenom} {pageUser?.nom}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-brand/5 text-brand capitalize">
                {pageRolePretty}
              </span>
              <span className="text-sm text-ink-secondary">{pageDepartment}</span>
            </div>
          </div>

          {/* Status badge */}
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-success/5 text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Active
            </span>
            <span className="text-xs text-ink-muted">
              Member since {formatDate(pageUser?.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Two Column: Academic Info + Contact ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Academic Information */}
        <div className="bg-surface rounded-lg border border-edge shadow-card">
          <div className="px-6 py-4 border-b border-edge-subtle flex items-center gap-2">
            <svg className="w-5 h-5 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
            <h2 className="text-base font-semibold text-ink">Academic Information</h2>
          </div>
          <div className="px-6 py-2 divide-y divide-edge-subtle">
            <InfoRow label="Role" value={pageRolePretty} icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
            } />
            <InfoRow label="Department" value={pageDepartment} icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" /></svg>
            } />
            {(student || isViewingSelectedStudent) && (
              <InfoRow label="Speciality" value={pageSpeciality} icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>
              } />
            )}
            <InfoRow label="Email Verified" value={pageUser?.emailVerified ? 'Yes' : 'Not yet'} icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            } />
            <InfoRow label="Last Login" value={formatDate(pageUser?.lastLogin)} icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            } />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-surface rounded-lg border border-edge shadow-card">
          <div className="px-6 py-4 border-b border-edge-subtle flex items-center gap-2">
            <svg className="w-5 h-5 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <h2 className="text-base font-semibold text-ink">Contact</h2>
          </div>
          <div className="px-6 py-2 divide-y divide-edge-subtle">
            <InfoRow label="Email" value={pageUser?.email} icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            } />
            <InfoRow label="Full Name" value={`${pageUser?.prenom || ''} ${pageUser?.nom || ''}`.trim()} icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            } />
            <InfoRow label="Account Created" value={formatDate(pageUser?.createdAt)} icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            } />
          </div>
        </div>
      </div>
    </div>
  );
}

