// Recreated stub — original deleted during Phase 2 cleanup. Was unused.
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../common/Navbar';

const MainLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children ?? <Outlet />}</main>
  </div>
);

export default MainLayout;
