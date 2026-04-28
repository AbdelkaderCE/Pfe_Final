import React from 'react';
import News from '../components/features/news/news';

export default function ActualitesPage({ role }) {
  const isGuest = !role || role === 'guest';

  return (
    <div className="min-h-screen bg-canvas">
      {isGuest && (
        <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6 lg:px-8">
          <div className="rounded-lg border border-edge-strong bg-brand-light px-4 py-3 text-center shadow-soft">
            <p className="text-sm font-medium text-brand">Sign in to personalize your feed and get notifications</p>
          </div>
        </div>
      )}

      <News />
    </div>
  );
}
