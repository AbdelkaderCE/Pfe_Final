import React from 'react';

const Field = ({ label, value }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wider text-ink-tertiary font-semibold">
      {label}
    </p>
    <p className="text-sm text-ink mt-1 break-words">{value || '—'}</p>
  </div>
);

export default function PromoCard({ promo }) {
  if (!promo) {
    return (
      <article className="bg-surface rounded-lg border border-edge shadow-card p-6">
        <h2 className="text-base font-semibold text-ink">Promo</h2>
        <p className="text-sm text-ink-tertiary mt-2">
          You are not yet assigned to a promo. Please contact the administration.
        </p>
      </article>
    );
  }

  const specialiteName = promo.specialite?.nom;
  const filiereName = promo.specialite?.filiere?.nom;

  return (
    <article className="bg-surface rounded-lg border border-edge shadow-card p-6">
      <header className="mb-5 pb-5 border-b border-edge-subtle">
        <h2 className="text-base font-semibold text-ink">Promo</h2>
        <p className="text-xs text-ink-tertiary mt-1">
          Your academic placement for the current year.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Promo" value={promo.nom} />
        <Field label="Specialite" value={specialiteName} />
        <Field label="Filiere" value={filiereName} />
        <Field label="Academic year" value={promo.anneeUniversitaire} />
        {promo.specialite?.niveau && (
          <Field label="Niveau" value={promo.specialite.niveau} />
        )}
      </div>
    </article>
  );
}
