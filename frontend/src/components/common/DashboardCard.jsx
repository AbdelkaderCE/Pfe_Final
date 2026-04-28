/* DashboardCard — placeholder, will be implemented later */
import React from 'react';
const DashboardCard = ({ children, className = '' }) => (
  <div className={`bg-surface border border-edge rounded-lg shadow-card p-6 ${className}`}>
    {children}
  </div>
);
export default DashboardCard;
