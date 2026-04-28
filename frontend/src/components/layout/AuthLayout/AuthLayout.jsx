// Recreated stub — original deleted during Phase 2 cleanup. Was unused.
import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center">
    {children ?? <Outlet />}
  </div>
);

export default AuthLayout;
