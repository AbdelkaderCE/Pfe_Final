import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../../services/api';

export default function HomeForgotPasswordOverlay({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('forgotPassword.errorEmpty'));
      return;
    }
    if (!email.includes('@')) {
      setError(t('forgotPassword.errorInvalid'));
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email.trim().toLowerCase());
      if (res && res.data && res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
      setSent(true);
    } catch (err) {
      setError(err?.message || t('forgotPassword.errorFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-forgot-title"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center overflow-y-auto px-4 py-6 sm:py-8 bg-black/45 backdrop-blur-md animate-[fadeIn_.18s_ease-out]"
      style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-[420px] max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-edge"
      >
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

        <div className="px-8 pt-8 pb-6 text-center border-b border-edge-subtle">
          <img
            src="/Logo.png"
            alt="Ibn Khaldoun University"
            className="mx-auto mb-4 w-14 h-14 rounded-lg object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 id="home-forgot-title" className="text-xl font-bold text-ink tracking-tight">
            {sent ? t('forgotPassword.titleSent') : t('forgotPassword.title')}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {sent ? t('forgotPassword.subtitleSent') : t('forgotPassword.subtitle')}
          </p>
        </div>

        <div className="px-8 pt-6 pb-8">
          {sent ? (
            <div>
              <div className="mb-6 mx-auto w-12 h-12 rounded-full bg-success/5 border border-edge-strong flex items-center justify-center">
                <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>

              <p className="text-sm text-ink-secondary text-center mb-2">
                {t('forgotPassword.sentTo')}
              </p>
              <p className="text-sm font-medium text-ink text-center mb-4 px-3 py-2 bg-surface-200 rounded-md break-all">
                {email}
              </p>

              {resetToken && (
                <div className="mb-5 p-3 rounded-md bg-warning/5 border border-edge-strong text-xs text-warning">
                  <p className="font-semibold mb-1.5">{t('forgotPassword.devMode')}</p>
                  <button
                    type="button"
                    onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                    className="underline font-medium break-all text-left w-full hover:opacity-80 transition-colors"
                  >
                    {t('forgotPassword.clickToReset')}
                  </button>
                </div>
              )}

              <p className="text-xs text-ink-muted text-center mb-6">
                {t('forgotPassword.checkSpam')}
              </p>

              <button
                type="button"
                onClick={() => navigate('/home?login=1')}
                className="w-full py-2.5 px-4 rounded-md text-sm font-medium text-white bg-brand hover:bg-brand-hover active:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150"
              >
                {t('forgotPassword.backToSignIn')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-5 px-3 py-2.5 rounded-md bg-danger/5 border border-edge-strong text-sm text-danger flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="overlay-reset-email" className="block mb-1.5 text-sm font-medium text-ink">
                  {t('forgotPassword.emailLabel')}
                </label>
                <input
                  id="overlay-reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@univ-ibn-khaldoun.dz"
                  autoFocus
                  className="w-full px-3 py-2.5 text-sm text-ink bg-control-bg border border-control-border rounded-md placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors duration-150"
                />
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
                {loading ? t('forgotPassword.sending') : t('forgotPassword.sendLink')}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/home?login=1')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors duration-150"
                >
                  <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  {t('forgotPassword.backToSignIn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}