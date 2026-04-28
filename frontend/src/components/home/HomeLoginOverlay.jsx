import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

/**
 * HomeLoginOverlay — Login card layered on top of the Home page.
 * Background is blurred via backdrop-filter on the overlay; the card itself
 * stays crisp. Open it with the floating "Sign in" button or via the Hero CTA.
 *
 * Reuses AuthContext.login (no API duplication) and shares the same redirect
 * logic the standalone /login page uses.
 */
export default function HomeLoginOverlay({ open, onClose }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, requiresPasswordChange, user } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizedRoles = Array.isArray(user?.roles)
    ? user.roles.map((roleName) => String(roleName || '').toLowerCase())
    : [];
  const isAdminUser = String(user?.coreRole || '').toLowerCase() === 'admin' || normalizedRoles.includes('admin');
  const isTeacherUser = String(user?.coreRole || '').toLowerCase() === 'enseignant'
    || normalizedRoles.includes('enseignant')
    || normalizedRoles.includes('teacher');
  const isStudentUser = String(user?.coreRole || '').toLowerCase() === 'etudiant'
    || normalizedRoles.includes('etudiant')
    || normalizedRoles.includes('student');

  const defaultPostLoginPath = isAdminUser ? '/admin' : '/dashboard';
  const requestedPath = location.state?.from?.pathname;
  const isAllowedRequestedPath = (() => {
    if (!requestedPath) return false;

    if (requestedPath === '/admin' || requestedPath.startsWith('/dashboard/admin')) {
      return isAdminUser;
    }

    if (requestedPath.startsWith('/dashboard/student/')) {
      return isStudentUser;
    }

    if (requestedPath.startsWith('/dashboard/teacher/')) {
      return isTeacherUser;
    }

    if (requestedPath.startsWith('/dashboard/discipline/admin')) {
      return isAdminUser;
    }

    if (requestedPath.startsWith('/dashboard/discipline/report') || requestedPath.startsWith('/dashboard/discipline/president')) {
      return isTeacherUser;
    }

    if (requestedPath.startsWith('/dashboard/documents')) {
      return isTeacherUser || isAdminUser;
    }

    if (requestedPath.startsWith('/dashboard/requests')) {
      return isStudentUser || isAdminUser;
    }

    return true;
  })();

  const postLoginPath = isAllowedRequestedPath ? requestedPath : defaultPostLoginPath;

  /* Close on Escape */
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  /* Lock body scroll while open */
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  /* Already-authenticated users get redirected straight to their dashboard */
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    if (requiresPasswordChange) { navigate('/change-password', { replace: true }); return; }
    navigate(postLoginPath, { replace: true });
  }, [open, isAuthenticated, requiresPasswordChange, navigate, postLoginPath]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) { setError(t('login.errorEmail')); return; }
    if (!password)          { setError(t('login.errorPassword')); return; }

    setLoading(true);
    try {
      await login(identifier.trim(), password);
      /* useEffect above handles the post-login redirect once user state hydrates */
    } catch (err) {
      setError(err?.message || t('login.errorInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-login-title"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center overflow-y-auto px-4 py-6 sm:py-8 bg-black/45 backdrop-blur-md animate-[fadeIn_.18s_ease-out]"
      style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-[420px] max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-edge"
        style={{ opacity: 1 }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-tertiary hover:bg-surface-200 hover:text-ink transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-edge-subtle">
          <img
            src="/Logo.png"
            alt="Ibn Khaldoun University"
            className="mx-auto mb-4 w-14 h-14 rounded-lg object-cover"
          />
          <h1 id="home-login-title" className="text-xl font-bold text-ink tracking-tight">
            {t('login.welcome')}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8">
          {error && (
            <div className="mb-5 px-3 py-2.5 rounded-md bg-danger/5 border border-edge-strong text-sm text-danger flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="overlay-identifier" className="block mb-1.5 text-sm font-medium text-ink">
              {t('login.emailOrId')}
            </label>
            <input
              id="overlay-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@univ-ibn-khaldoun.dz"
              autoFocus
              className="w-full px-3 py-2.5 text-sm text-ink bg-control-bg border border-control-border rounded-md placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors duration-150"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="overlay-password" className="block mb-1.5 text-sm font-medium text-ink">
              {t('login.password')}
            </label>
            <div className="relative">
              <input
                id="overlay-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 text-sm text-ink bg-control-bg border border-control-border rounded-md placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary transition-colors duration-150"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember((v) => !v)}
                className="w-4 h-4 rounded border-control-border accent-brand"
              />
              {t('login.rememberMe')}
            </label>
            <Link
              to="/home?forgot=1"
              className="text-sm font-medium text-brand hover:text-brand-hover transition-colors duration-150"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md text-sm font-medium text-white bg-brand hover:bg-brand-hover active:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? t('login.signingIn') : t('common.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
