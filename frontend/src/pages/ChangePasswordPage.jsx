import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ── Password strength heuristic ──────────────────────────────────
   Produces a 0–4 score plus a label/colour. Mirrors common rules:
   length ≥ 8, mixed case, digits, symbols. Pure UI feedback — backend
   still owns authoritative validation. */
function evaluateStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'bg-edge', textColor: 'text-ink-tertiary' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  const map = [
    { label: 'Too weak',  color: 'bg-danger',  textColor: 'text-danger' },
    { label: 'Weak',      color: 'bg-danger',  textColor: 'text-danger' },
    { label: 'Fair',      color: 'bg-warning', textColor: 'text-warning' },
    { label: 'Strong',    color: 'bg-success', textColor: 'text-success' },
    { label: 'Excellent', color: 'bg-success', textColor: 'text-success' },
  ];
  return { score, ...map[score] };
}

const inputBase =
  'w-full pl-10 pr-10 py-2.5 text-sm text-ink bg-control-bg border rounded-lg ' +
  'placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 ' +
  'focus:border-brand transition-colors duration-150';

function PasswordField({ id, label, value, onChange, placeholder, autoComplete, error }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block mb-1.5 text-sm font-medium text-ink-secondary">
        {label}
      </label>
      <div className="relative">
        <KeyRound
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-tertiary"
          strokeWidth={1.75}
        />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${inputBase} ${error ? 'border-danger' : 'border-control-border'}`}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary transition-colors duration-150"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { logout, setRequiresPasswordChange } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = useMemo(() => evaluateStrength(newPassword), [newPassword]);
  const matches = confirmPassword.length > 0 && newPassword === confirmPassword;
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const errs = {};

    if (!currentPassword) errs.currentPassword = 'Required';
    if (!newPassword)     errs.newPassword     = 'Required';
    if (!confirmPassword) errs.confirmPassword = 'Required';
    if (newPassword && newPassword.length < 8) {
      errs.newPassword = 'Must be at least 8 characters.';
    }
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully. Redirecting to sign in…');
      setRequiresPasswordChange(false);

      await logout();
      setTimeout(() => navigate('/login', { replace: true }), 800);
    } catch (err) {
      setError(err?.message || 'Unable to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-edge rounded-2xl shadow-card overflow-hidden">
          {/* Header band */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-edge-subtle">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
              <Lock className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <h1 className="text-xl font-bold text-ink tracking-tight">Change Password</h1>
            <p className="mt-1 text-sm text-ink-tertiary">
              Set a new password to secure your account.
            </p>
          </div>

          {/* Body */}
          <div className="px-8 pt-6 pb-8">
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordField
                id="current-password"
                label="Current / Temporary Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                autoComplete="current-password"
                error={fieldErrors.currentPassword}
              />

              <div>
                <PasswordField
                  id="new-password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  error={fieldErrors.newPassword}
                />

                {newPassword && (
                  <div className="mt-2.5">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < strength.score ? strength.color : 'bg-edge'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`mt-1.5 text-xs font-medium ${strength.textColor}`}>
                      Strength: {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <PasswordField
                  id="confirm-password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  error={fieldErrors.confirmPassword}
                />

                {matches && !fieldErrors.confirmPassword && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-success">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Passwords match
                  </p>
                )}
                {mismatch && !fieldErrors.confirmPassword && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-warning">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Passwords do not match yet
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Updating…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Update Password
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-xs text-ink-tertiary text-center">
              Use 8+ characters with uppercase, lowercase, a number and a symbol for the strongest password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
