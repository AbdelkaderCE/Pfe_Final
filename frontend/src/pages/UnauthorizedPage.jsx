/*
  UnauthorizedPage — shown when a user tries to access a role-restricted route.
  Uses design-system tokens.
*/

import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-danger/5 rounded-full mb-6">
          <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-ink tracking-tight mb-2">Access Denied</h1>
        <p className="text-sm text-ink-secondary mb-8">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2.5 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-all duration-150"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2.5 bg-surface border border-edge rounded-md text-sm font-medium text-ink-secondary hover:bg-surface-200 transition-all duration-150"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
