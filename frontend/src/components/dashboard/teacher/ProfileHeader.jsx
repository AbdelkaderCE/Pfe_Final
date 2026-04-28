import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { resolveMediaUrl } from '../../../services/api';

export default function ProfileHeader({ profile }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const defaultAvatar = "https://ui-avatars.com/api/?name=" + 
    (profile?.nom || 'Teacher') + "+" + (profile?.prenom || '');
  const resolvedProfilePhoto = resolveMediaUrl(profile?.photo) || defaultAvatar;

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="bg-surface rounded-lg shadow-card border border-edge p-6 flex flex-col md:flex-row items-center justify-between transition-all duration-300 hover:shadow-lg">
      
      <div className="flex items-center space-x-6 rtl:space-x-reverse">
        <div className="relative">
          <img 
            src={resolvedProfilePhoto}
            alt="Profile Avatar" 
            className="w-24 h-24 rounded-full object-cover border-4 border-edge-strong"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = defaultAvatar;
            }}
          />
          <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-surface rounded-full"></div>
        </div>
        
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {profile?.nom} {profile?.prenom}
          </h1>
          <div className="flex items-center mt-1 space-x-3 rtl:space-x-reverse">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand">
              {profile?.grade || 'Professeur'}
            </span>
            <span className="text-sm text-ink-muted">
              {profile?.email}
            </span>
          </div>
          {profile?.bureau && (
            <p className="mt-2 text-sm text-ink-secondary flex items-center">
              <svg className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              Bureau: {profile.bureau}
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-6 md:mt-0 flex flex-col md:items-end gap-3">
        {/* Language Switcher */}
        <button 
          onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
          className="flex items-center justify-center px-4 py-2 w-full md:w-auto text-sm font-medium transition-colors bg-surface border border-edge text-ink-secondary rounded-lg hover:bg-surface-200 focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
          {t('header.switchLang')}
        </button>

        {/* Secure Logout Feature */}
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center px-4 py-2 w-full md:w-auto text-sm font-bold transition-colors bg-danger/10 hover:bg-danger/20 text-danger rounded-lg focus:outline-none focus:ring-2 focus:ring-danger/30 shadow-sm border border-danger/30"
        >
          <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          {t('logout', { defaultValue: 'Logout' })}
        </button>
      </div>

    </div>
  );
}

