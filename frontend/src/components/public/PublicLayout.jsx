import React from 'react';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

export default function PublicLayout({ children, contained = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink overflow-x-hidden">
      <PublicNavbar />
      {/* pt-16 offsets the fixed navbar */}
      <main className="flex-1 pt-16">
        {contained ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        ) : (
          children
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
