// Recreated stub — original deleted during Phase 2 cleanup. Was unused.
// Role-based route guard. The active guard used by App.jsx is components/auth/ProtectedRoute.
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * @param {string[]} allowedRoles  — e.g. ['TEACHER','ADMIN_SUPER']
 * @param {string}   redirectTo    — where to send unauthenticated users
 */
const PrivateRoute = ({ allowedRoles = [], redirectTo = '/login' }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to={redirectTo} replace />;

  if (allowedRoles.length > 0) {
    const roles = Array.isArray(user.roles) ? user.roles : [];
    const allowed = roles.some((r) => allowedRoles.includes(r));
    if (!allowed) return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
