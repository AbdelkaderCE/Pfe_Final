/*
  ProtectedRoute — Redirects unauthenticated users to /login.
  Shows a loading spinner while the auth state is being checked.
*/

import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canAccess } from '../../utils/rbac';

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  requireAllPermissions = false,
  accessMode = 'all',
  accessFn = null,
}) {
  const { isAuthenticated, loading, requiresPasswordChange, user } = useAuth();
  const location = useLocation();
  const params = useParams();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-brand" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-ink-secondary">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiresPasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  const authorized = canAccess(user, {
    allowedRoles,
    requiredPermissions,
    requireAllPermissions,
    mode: accessMode,
  });

  if (!authorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Resource-bound check (e.g. president-of-conseil-X). Runs after the broad
  // role/permission gate so accessFn can rely on user being authenticated.
  if (typeof accessFn === 'function' && !accessFn(user, params)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
