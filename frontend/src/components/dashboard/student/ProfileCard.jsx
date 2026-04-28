import React from 'react';
import { resolveMediaUrl } from '../../../services/api';

const Initials = ({ name, size = 'w-16 h-16 text-xl' }) => {
  const initials = String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={`${size} rounded-full bg-brand-light flex items-center justify-center shrink-0`}
    >
      <span className="font-bold text-brand">{initials || '?'}</span>
    </div>
  );
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wider text-ink-tertiary font-semibold">
      {label}
    </p>
    <p className="text-sm text-ink mt-1 break-words">{value || '—'}</p>
  </div>
);

export default function ProfileCard({ profile }) {
  if (!profile) return null;
  const fullName = `${profile.prenom || ''} ${profile.nom || ''}`.trim();
  const photoUrl = profile.photo ? resolveMediaUrl(profile.photo) : '';

  return (
    <article className="bg-surface rounded-lg border border-edge shadow-card p-6">
      <header className="flex items-center gap-4 mb-5 pb-5 border-b border-edge-subtle">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={fullName}
            className="w-16 h-16 rounded-full object-cover border border-edge"
          />
        ) : (
          <Initials name={fullName} />
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink truncate">{fullName || '—'}</h2>
          <p className="text-xs text-ink-tertiary truncate">
            {profile.matricule ? `Matricule ${profile.matricule}` : 'Student'}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" value={profile.email} />
        <Field label="Phone" value={profile.telephone} />
      </div>
    </article>
  );
}
