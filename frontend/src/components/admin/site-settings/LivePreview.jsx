import React from 'react';
import { Sparkles } from 'lucide-react';

export default function LivePreview({
  universityName,
  subtitle,
  city,
  logoUrl,
  heroBackgroundUrl,
  primaryStat,
  primaryStatLabel,
  showAnimations = true,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
      <div className="border-b border-edge-subtle bg-surface-200/60 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
          <Sparkles className="h-3.5 w-3.5 text-brand" strokeWidth={2.2} />
          Live preview
        </div>
      </div>

      <div className="relative h-56 overflow-hidden">
        {heroBackgroundUrl ? (
          <img
            src={heroBackgroundUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 gradient-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-end px-5 py-5 text-white">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className={`h-10 w-10 rounded-lg border border-white/40 bg-white/10 object-contain p-1 ${
                  showAnimations ? 'transition-transform duration-300 hover:scale-105' : ''
                }`}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-xs font-bold uppercase">
                {universityName?.[0] || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">{city}</p>
              <h3 className="truncate text-lg font-semibold">{universityName}</h3>
            </div>
          </div>
          <p className="mt-2 line-clamp-2 max-w-md text-sm text-white/85">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-edge-subtle border-t border-edge-subtle bg-surface">
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-bold text-ink">{primaryStat || '—'}</p>
          <p className="text-[11px] uppercase tracking-wider text-ink-tertiary">
            {primaryStatLabel}
          </p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-bold text-brand">●</p>
          <p className="text-[11px] uppercase tracking-wider text-ink-tertiary">Brand</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-bold text-ink">
            {showAnimations ? 'On' : 'Off'}
          </p>
          <p className="text-[11px] uppercase tracking-wider text-ink-tertiary">Motion</p>
        </div>
      </div>
    </div>
  );
}
