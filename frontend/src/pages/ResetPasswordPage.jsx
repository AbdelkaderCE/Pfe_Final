/*
  Intent: User has a valid reset token and needs to set a new password.
          Calm, institutional feel  same tokens as Login page.
  Palette: canvas, surface, brand.
  Depth: shadow-card on card.
*/

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!token) {
      setError(t('resetPassword.errorNoToken'));
    }
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError(t('resetPassword.errorEmpty'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.errorMismatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('resetPassword.errorWeak'));
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message || t('resetPassword.errorFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-[420px] bg-surface rounded-lg shadow-card border border-edge">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-edge-subtle">
          <img
            src="/Logo.png"
            alt="Ibn Khaldoun University"
            className="mx-auto mb-4 w-14 h-14 rounded-lg object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <h1 className="text-xl font-bold text-ink tracking-tight">
            {done ? t('resetPassword.titleDone') : t('resetPassword.title')}
          </h1>
          <p className="mt-1 text-sm text-ink-tertiary">
            {done ? t('resetPassword.subtitleDone') : t('resetPassword.subtitle')}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 pt-6 pb-8">
          {done ? (
            <div>
              <div className="mb-6 mx-auto w-12 h-12 rounded-full bg-success/5 border border-edge-strong flex items-center justify-center">
                <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-sm text-ink-secondary text-center mb-6">
                {t('resetPassword.successMessage')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-4 rounded-md text-sm font-medium text-white
                           bg-brand hover:bg-brand-hover active:bg-brand-dark
                           focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2
                           transition-all duration-150"
              >
                {t('resetPassword.goToLogin')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Error banner */}
              {error && (
                <div className="mb-5 px-3 py-2.5 rounded-md bg-danger/5 border border-edge-strong text-sm text-danger flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* New password */}
              <div className="mb-4">
                <label htmlFor="new-password" className="block mb-1.5 text-sm font-medium text-ink-secondary">
                  {t('resetPassword.newPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder=""
                    autoFocus
                    disabled={!token}
                    className="w-full px-3 py-2.5 pr-10 text-sm text-ink bg-control-bg border border-control-border rounded-md
                               placeholder:text-ink-muted
                               focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-colors duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary transition-colors"
                    tabIndex={-1}
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
                <p className="mt-1.5 text-xs text-ink-muted">{t('resetPassword.passwordHint')}</p>
              </div>

              {/* Confirm password */}
              <div className="mb-6">
                <label htmlFor="confirm-password" className="block mb-1.5 text-sm font-medium text-ink-secondary">
                  {t('resetPassword.confirmPasswordLabel')}
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder=""
                  disabled={!token}
                  className="w-full px-3 py-2.5 text-sm text-ink bg-control-bg border border-control-border rounded-md
                             placeholder:text-ink-muted
                             focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors duration-150"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-2.5 px-4 rounded-md text-sm font-medium text-white
                           bg-brand hover:bg-brand-hover active:bg-brand-dark
                           focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-150
                           flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? t('resetPassword.resetting') : t('resetPassword.resetButton')}
              </button>

              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors duration-150"
                >
                  <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  {t('forgotPassword.backToSignIn')}
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Back to home */}
        <div className="px-8 pb-6 text-center border-t border-edge-subtle pt-4">
          <Link
            to="/home"
            className="inline-flex items-center gap-1.5 text-sm text-ink-tertiary hover:text-brand transition-colors duration-150"
          >
            <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t('common.goHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}

