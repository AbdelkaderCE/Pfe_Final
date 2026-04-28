/*
  RegisterPage — Multi-step student registration form.
  Adapted from friend's project to our design system (JSX, design tokens, inline SVGs).
  3 steps: Personal Info → Academic Info → Password.
*/

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { getPasswordStrength } from '../utils/validators';

const registerImage =
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80';

/* ── Inline SVG icons (rules.md: no emoji, consistent 1.5px stroke) ── */
const IconUserPlus = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m1.5-1.5h-3m-2.25-4.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0" />
  </svg>
);
const IconEye = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconEyeOff = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);
const IconArrowRight = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);
const IconArrowLeft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconX = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/* ── Reusable form input (uses design tokens) ───────────────── */
const FormInput = ({ label, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-ink-secondary mb-1">{label}</label>
    <input
      className={`w-full px-3 py-2.5 bg-control-bg border rounded-md text-sm text-ink placeholder:text-ink-muted
        transition-all duration-150
        ${error ? 'border-danger focus:ring-danger/30' : 'border-control-border focus:ring-brand/30 focus:border-brand'}
        focus:ring-2 focus:outline-none`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-danger">{error}</p>}
  </div>
);

/* ── Main Component ─────────────────────────────────────────── */

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    prenom: '', nom: '', email: '', phone: '',
    studentId: '', department: 'computer-science', level: 'L1', speciality: '',
    password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    document.title = t('register.pageTitle');
  }, [t]);

  const handleChange = (field) => (e) => {
    const value = e?.target?.value ?? e;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  /* ── Step validators ──────────────────────────────────────── */
  const validateStep1 = () => {
    const e = {};
    if (!formData.prenom) e.prenom = t('register.errorFirstName');
    if (!formData.nom) e.nom = t('register.errorLastName');
    if (!formData.email) e.email = t('register.errorEmail');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = t('register.errorEmailInvalid');
    if (!formData.phone) e.phone = t('register.errorPhone');
    else if (!/^(\+213|0)[5-7]\d{8}$/.test(formData.phone)) e.phone = t('register.errorPhoneInvalid');
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!formData.studentId) e.studentId = t('register.errorStudentId');
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!formData.password) e.password = t('register.errorPassword');
    else if (formData.password.length < 8) e.password = t('register.errorPasswordLength');
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      e.password = t('register.errorPasswordComplexity');
    if (formData.password !== formData.confirmPassword) e.confirmPassword = t('register.errorPasswordMatch');
    if (!acceptedTerms) e.terms = t('register.errorTerms');
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setIsLoading(true);
    setServerError('');
    try {
      await authAPI.register(formData);
      navigate('/login?registered=true');
    } catch (err) {
      setServerError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const pwStrength = () => {
    let s = 0;
    if (formData.password.length >= 8) s++;
    if (/[A-Z]/.test(formData.password)) s++;
    if (/[a-z]/.test(formData.password)) s++;
    if (/\d/.test(formData.password)) s++;
    if (/[^A-Za-z0-9]/.test(formData.password)) s++;
    return s;
  };

  const strengthLabel = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* ── Left: hero image ──────────────────────────────────── */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img src={registerImage} alt="University campus" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <div className="text-white">
            <div className="inline-flex items-center bg-surface/15 backdrop-blur-md rounded-full px-3 py-1 mb-5 border border-edge-strong">
              <span className="text-xs font-medium tracking-wide">{t('register.joinCommunity')}</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              {t('register.buildProfile')}
              <span className="block text-white/80">{t('register.academicProfile')}</span>
            </h2>
            <p className="mt-3 text-sm text-white/70 max-w-sm">
              {t('register.heroSubtitle')}
            </p>
          </div>
          <p className="text-white/50 text-xs">{t('register.secureRegistration')}</p>
        </div>
      </div>

      {/* ── Right: form ───────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-surface border border-edge shadow-card rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand rounded-lg text-white mb-4 shadow-soft">
              <IconUserPlus />
            </div>
            <h1 className="text-xl font-bold text-ink tracking-tight">{t('register.createAccount')}</h1>
            <p className="text-sm text-ink-secondary">{t('register.getStarted')}</p>
          </div>

          {/* Progress */}
          <div className="flex justify-between mb-6 max-w-md mx-auto">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all duration-200
                  ${s <= step ? 'bg-brand text-white shadow-sm' : 'bg-surface-200 text-ink-tertiary'}`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-200
                    ${s < step ? 'bg-brand' : 'bg-surface-300'}`} />
                )}
              </div>
            ))}
          </div>

          {serverError && (
            <div className="mb-4 px-3 py-2.5 bg-danger/5 border border-edge-strong rounded-md flex items-start gap-2">
              <svg className="w-4 h-4 text-danger shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-danger">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1 — Personal */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label={t('register.firstName')} type="text" value={formData.prenom} onChange={handleChange('prenom')} placeholder="Ahmed" error={errors.prenom} required />
                  <FormInput label={t('register.lastName')} type="text" value={formData.nom} onChange={handleChange('nom')} placeholder="Benali" error={errors.nom} required />
                </div>
                <FormInput label={t('register.emailAddress')} type="email" value={formData.email} onChange={handleChange('email')} placeholder="you@univ-tiaret.dz" error={errors.email} required />
                <FormInput label={t('register.phoneNumber')} type="tel" value={formData.phone} onChange={handleChange('phone')} placeholder="0555 12 34 56" error={errors.phone} required />
              </div>
            )}

            {/* Step 2 — Academic */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <FormInput label={t('register.studentId')} type="text" value={formData.studentId} onChange={handleChange('studentId')} placeholder="2024001234" error={errors.studentId} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-1">{t('register.department')}</label>
                    <select value={formData.department} onChange={(e) => handleChange('department')(e.target.value)}
                      className="w-full px-3 py-2.5 bg-control-bg border border-control-border rounded-md text-sm text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-none">
                      <option value="computer-science">{t('register.deptCS')}</option>
                      <option value="mathematics">{t('register.deptMath')}</option>
                      <option value="physics">{t('register.deptPhysics')}</option>
                      <option value="chemistry">{t('register.deptChemistry')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-1">{t('register.level')}</label>
                    <select value={formData.level} onChange={(e) => handleChange('level')(e.target.value)}
                      className="w-full px-3 py-2.5 bg-control-bg border border-control-border rounded-md text-sm text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-none">
                      <option value="L1">Licence 1</option>
                      <option value="L2">Licence 2</option>
                      <option value="L3">Licence 3</option>
                      <option value="M1">Master 1</option>
                      <option value="M2">Master 2</option>
                    </select>
                  </div>
                </div>
                <FormInput label={t('register.speciality')} type="text" value={formData.speciality} onChange={handleChange('speciality')} placeholder={t('register.specialityPlaceholder')} />
              </div>
            )}

            {/* Step 3 — Password */}
            {step === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <FormInput label={t('register.password')} type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange('password')} placeholder="••••••••" error={errors.password} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-ink-tertiary hover:text-ink transition-colors">
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                  <div className="relative">
                    <FormInput label={t('register.confirmPassword')} type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange('confirmPassword')} placeholder="••••••••" error={errors.confirmPassword} required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-8 text-ink-tertiary hover:text-ink transition-colors">
                      {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                {/* Password Strength */}
                {formData.password && (
                  <div className="bg-surface-200 p-4 rounded-lg border border-edge">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-ink-secondary">{t('register.passwordStrength')}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${strengthLabel === 'weak' ? 'bg-danger/50 text-danger' :
                          strengthLabel === 'medium' ? 'bg-warning/50 text-warning' :
                          'bg-success/50 text-success'}`}>
                        {t(`register.${strengthLabel}`)}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1.5 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`flex-1 rounded-full transition-all
                          ${s <= pwStrength()
                            ? pwStrength() <= 2 ? 'bg-danger' : pwStrength() <= 4 ? 'bg-warning' : 'bg-success'
                            : 'bg-surface-300'}`} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { test: formData.password.length >= 8, text: t('register.minChars') },
                        { test: /[A-Z]/.test(formData.password), text: t('register.uppercase') },
                        { test: /[a-z]/.test(formData.password), text: t('register.lowercase') },
                        { test: /\d/.test(formData.password), text: t('register.number') },
                      ].map((req, i) => (
                        <div key={i} className="flex items-center text-xs gap-1">
                          {req.test ? <span className="text-success"><IconCheck /></span> : <span className="text-ink-muted"><IconX /></span>}
                          <span className={req.test ? 'text-success' : 'text-ink-muted'}>{req.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex items-start p-3 bg-surface-200 rounded-md border border-edge hover:border-edge-strong transition-colors cursor-pointer">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="h-4 w-4 text-brand focus:ring-brand/30 border-control-border rounded mt-0.5" />
                  <span className="ml-2 text-xs text-ink-secondary">
                    {t('register.agreeTerms')}{' '}
                    <Link to="/terms" className="text-brand font-medium hover:underline">{t('register.terms')}</Link>{' '}{t('register.and')}{' '}
                    <Link to="/privacy" className="text-brand font-medium hover:underline">{t('register.privacyPolicy')}</Link>
                  </span>
                </label>
                {errors.terms && <p className="text-xs text-danger">{errors.terms}</p>}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-2">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-surface border border-edge rounded-md text-sm font-medium text-ink-secondary hover:bg-surface-200 focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150">
                  <IconArrowLeft /> {t('register.back')}
                </button>
              )}
              {step < 3 ? (
                <button type="button" onClick={handleNext}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover active:bg-brand-dark focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150 ${step === 1 ? 'w-full justify-center' : 'ml-auto'}`}>
                  {t('register.next')} <IconArrowRight />
                </button>
              ) : (
                <button type="submit" disabled={isLoading}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover active:bg-brand-dark focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${step > 1 ? 'ml-auto' : 'w-full justify-center'}`}>
                  {isLoading ? (
                    <><span className="h-4 w-4 rounded-full border-2 border-edge-subtle border-t-white animate-spin" /> {t('register.creating')}</>
                  ) : t('register.createAccount')}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-xs text-ink-tertiary mt-4">
            {t('register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-medium text-brand hover:underline">{t('common.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

