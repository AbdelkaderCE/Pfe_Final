// Recreated stub — original deleted during Phase 2 cleanup. Was unused.
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NAV_ITEMS = [
  { key: 'navbar.home', path: '/home' },
  { key: 'navbar.about', path: '/about' },
  { key: 'navbar.contact', path: '/contact' },
];

const Navbar = () => {
  const { t } = useTranslation();
  return (
    <nav className="flex items-center gap-4 p-4">
      {NAV_ITEMS.map((item) => (
        <Link key={item.key} to={item.path}>{t(item.key)}</Link>
      ))}
    </nav>
  );
};

export default Navbar;
