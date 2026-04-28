import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import ThemeSwitcher from '../theme/ThemeSwitcher';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, resolveMediaUrl } from '../services/api';

const SETTINGS_STORAGE_PREFIX = 'ik-user-settings-v1';
const MAX_PROFILE_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

function createDefaultSettings(language = 'fr') {
  return {
    general: {
      language,
      timezone: 'africa-algiers',
      dateFormat: 'dd-mm-yyyy',
      startPage: '/dashboard',
    },
    notifications: {
      email: true,
      push: true,
      newsUpdates: true,
      deadlineReminders: true,
    },
    privacy: {
      showProfile: true,
      showEmail: false,
      showPhone: false,
      activityStatus: true,
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
    },
  };
}

function mergeSettings(defaults, persisted = {}) {
  return {
    general: {
      ...defaults.general,
      ...(persisted.general || {}),
    },
    notifications: {
      ...defaults.notifications,
      ...(persisted.notifications || {}),
    },
    privacy: {
      ...defaults.privacy,
      ...(persisted.privacy || {}),
    },
    accessibility: {
      ...defaults.accessibility,
      ...(persisted.accessibility || {}),
    },
  };
}

function getStorageKeyForUser(userId) {
  return `${SETTINGS_STORAGE_PREFIX}:${userId || 'anonymous'}`;
}

function readSettingsFromStorage(storageKey, fallbackLanguage) {
  const defaults = createDefaultSettings(fallbackLanguage);

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw);
    return mergeSettings(defaults, parsed);
  } catch {
    return defaults;
  }
}

function writeSettingsToStorage(storageKey, settings) {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}

function applyAccessibilitySettings(accessibility) {
  const root = document.documentElement;

  root.classList.toggle('reduced-motion', Boolean(accessibility?.reducedMotion));
  root.classList.toggle('high-contrast', Boolean(accessibility?.highContrast));
  root.classList.toggle('large-text', Boolean(accessibility?.largeText));
}

function getInitials(prenom, nom) {
  const left = (prenom || '?').trim().charAt(0);
  const right = (nom || '?').trim().charAt(0);
  return `${left}${right}`.toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Toggle({ enabled, onChange, label, description, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description ? <p className="text-xs text-ink-tertiary mt-0.5">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange?.(!enabled)}
        className={`
          shrink-0 relative inline-flex h-5 w-9 items-center rounded-full
          transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
          ${enabled ? 'bg-brand' : 'bg-surface-300'}
        `}
      >
        <span
          className={`
            inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm
            transition-transform duration-150
            ${enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}
          `}
        />
      </button>
    </div>
  );
}

function SelectRow({ label, description, value, options, onChange, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description ? <p className="text-xs text-ink-tertiary mt-0.5">{description}</p> : null}
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className="shrink-0 text-sm font-medium text-ink bg-control-bg border border-control-border rounded-md px-3 py-1.5 focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function SettingsSection({ title, description, icon, children }) {
  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card">
      <div className="px-6 py-4 border-b border-edge-subtle flex items-center gap-3">
        <span className="w-5 h-5 text-ink-tertiary shrink-0">{icon}</span>
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description ? <p className="text-xs text-ink-tertiary mt-0.5">{description}</p> : null}
        </div>
      </div>
      <div className="px-6 divide-y divide-edge-subtle">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { mode, accent } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();
  const roleList = Array.isArray(user?.roles)
    ? user.roles.map((roleName) => String(roleName || '').toLowerCase())
    : [];
  const canAccessRequestsPage = roleList.includes('admin') || roleList.includes('etudiant') || roleList.includes('student');
  const photoInputRef = useRef(null);
  const initialLanguageRef = useRef(i18n.language?.substring(0, 2) || 'fr');

  const storageKey = useMemo(() => getStorageKeyForUser(user?.id), [user?.id]);

  const [settings, setSettings] = useState(() =>
    readSettingsFromStorage(storageKey, initialLanguageRef.current)
  );
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoPending, setIsPhotoPending] = useState(false);

  useEffect(() => {
    const nextSettings = readSettingsFromStorage(storageKey, initialLanguageRef.current);
    setSettings(nextSettings);
    applyAccessibilitySettings(nextSettings.accessibility);
  }, [storageKey]);

  const setMessage = (type, message) => {
    setFeedback({ type, message });
  };

  const updateSettings = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  useEffect(() => {
    if (!canAccessRequestsPage && settings.general.startPage === '/dashboard/requests') {
      updateSettings('general', 'startPage', '/dashboard');
    }
  }, [canAccessRequestsPage, settings.general.startPage]);

  const handleLanguageChange = async (nextLanguage) => {
    updateSettings('general', 'language', nextLanguage);

    await i18n.changeLanguage(nextLanguage);
    document.documentElement.dir = nextLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLanguage;
  };

  const handleAccessibilityToggle = (key, value) => {
    const nextAccessibility = {
      ...settings.accessibility,
      [key]: value,
    };

    updateSettings('accessibility', key, value);
    applyAccessibilitySettings(nextAccessibility);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setMessage('', '');

    try {
      writeSettingsToStorage(storageKey, settings);
      applyAccessibilitySettings(settings.accessibility);

      const lang = settings.general.language;
      await i18n.changeLanguage(lang);
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;

      setMessage('success', 'Settings saved successfully.');
    } catch (error) {
      setMessage('error', error?.message || 'Unable to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    const defaults = createDefaultSettings(i18n.language?.substring(0, 2) || 'fr');

    setSettings(defaults);
    writeSettingsToStorage(storageKey, defaults);
    applyAccessibilitySettings(defaults.accessibility);

    const lang = defaults.general.language;
    await i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    setMessage('success', 'Settings were reset to defaults.');
  };

  const handleUploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage('error', 'Please select a valid image file.');
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
      setMessage('error', 'Image is too large. Maximum allowed size is 5 MB.');
      return;
    }

    setIsPhotoPending(true);
    setMessage('', '');

    try {
      await authAPI.uploadProfilePhoto(file);
      await fetchUser();
      setMessage('success', 'Profile photo updated successfully.');
    } catch (error) {
      setMessage('error', error?.message || 'Unable to upload profile photo.');
    } finally {
      setIsPhotoPending(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsPhotoPending(true);
    setMessage('', '');

    try {
      await authAPI.removeProfilePhoto();
      await fetchUser();
      setMessage('success', 'Profile photo removed.');
    } catch (error) {
      setMessage('error', error?.message || 'Unable to remove profile photo.');
    } finally {
      setIsPhotoPending(false);
    }
  };

  const profilePhotoUrl = resolveMediaUrl(user?.photo);
  const initials = getInitials(user?.prenom, user?.nom);

  return (
    <div className="space-y-6 max-w-3xl min-w-0">
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-ink-tertiary">{t('settings.subtitle')}</p>
      </div>

      {feedback.message ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            feedback.type === 'error'
              ? 'border-danger/50 bg-danger/50 text-danger'
              : 'border-success/50 bg-success/50 text-success'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <SettingsSection
        title="Profile photo"
        description="Upload, update or remove your profile picture."
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      >
        <div className="py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border border-edge"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/Logo.png';
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-light text-brand flex items-center justify-center text-xl font-bold border border-edge">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">
                {`${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'User'}
              </p>
              <p className="text-xs text-ink-tertiary truncate">{user?.email || '-'}</p>
              <p className="text-xs text-ink-muted mt-1">PNG, JPG, WEBP, GIF - up to 5 MB</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadPhoto}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isPhotoPending}
              className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark transition-colors duration-150 disabled:opacity-60"
            >
              {isPhotoPending ? 'Uploading...' : 'Upload photo'}
            </button>

            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isPhotoPending || !user?.photo}
              className="px-4 py-2 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t('settings.appearance')}
        description={t('settings.appearanceDesc')}
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
          </svg>
        }
      >
        <div className="py-4">
          <ThemeSwitcher />
        </div>
        <div className="py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">{t('settings.currentTheme')}</p>
            <p className="text-xs text-ink-tertiary mt-0.5">
              {mode === 'dark' ? 'Dark' : 'Light'} mode · {accent.charAt(0).toUpperCase() + accent.slice(1)} accent
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-brand/5 text-brand">
            {t('settings.active')}
          </span>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t('settings.general')}
        description={t('settings.generalDesc')}
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
          </svg>
        }
      >
        <SelectRow
          label={t('settings.language')}
          description={t('settings.languageDesc')}
          value={settings.general.language}
          onChange={handleLanguageChange}
          options={[
            { value: 'fr', label: 'Francais' },
            { value: 'ar', label: 'العربية' },
            { value: 'en', label: 'English' },
          ]}
        />
        <SelectRow
          label={t('settings.timezone')}
          description={t('settings.timezoneDesc')}
          value={settings.general.timezone}
          onChange={(value) => updateSettings('general', 'timezone', value)}
          options={[
            { value: 'africa-algiers', label: 'Africa/Algiers (CET)' },
            { value: 'europe-paris', label: 'Europe/Paris (CET)' },
            { value: 'utc', label: 'UTC' },
          ]}
        />
        <SelectRow
          label={t('settings.dateFormat')}
          description={t('settings.dateFormatDesc')}
          value={settings.general.dateFormat}
          onChange={(value) => updateSettings('general', 'dateFormat', value)}
          options={[
            { value: 'dd-mm-yyyy', label: 'DD/MM/YYYY' },
            { value: 'mm-dd-yyyy', label: 'MM/DD/YYYY' },
            { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD' },
          ]}
        />
        <SelectRow
          label={t('settings.startPage')}
          description={t('settings.startPageDesc')}
          value={settings.general.startPage}
          onChange={(value) => updateSettings('general', 'startPage', value)}
          options={[
            { value: '/dashboard', label: 'Dashboard' },
            { value: '/dashboard/actualites', label: 'Actualites' },
            ...(canAccessRequestsPage ? [{ value: '/dashboard/requests', label: 'Requests' }] : []),
            { value: '/dashboard/documents', label: 'Documents' },
          ]}
        />
      </SettingsSection>

      <SettingsSection
        title={t('settings.notifications')}
        description={t('settings.notificationsDesc')}
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        }
      >
        <Toggle
          label={t('settings.emailNotif')}
          description={t('settings.emailNotifDesc')}
          enabled={settings.notifications.email}
          onChange={(value) => updateSettings('notifications', 'email', value)}
        />
        <Toggle
          label={t('settings.pushNotif')}
          description={t('settings.pushNotifDesc')}
          enabled={settings.notifications.push}
          onChange={(value) => updateSettings('notifications', 'push', value)}
        />
        <Toggle
          label={t('settings.newsUpdates')}
          description={t('settings.newsUpdatesDesc')}
          enabled={settings.notifications.newsUpdates}
          onChange={(value) => updateSettings('notifications', 'newsUpdates', value)}
        />
        <Toggle
          label={t('settings.deadlineReminders')}
          description={t('settings.deadlineRemindersDesc')}
          enabled={settings.notifications.deadlineReminders}
          onChange={(value) => updateSettings('notifications', 'deadlineReminders', value)}
        />
      </SettingsSection>

      <SettingsSection
        title={t('settings.privacy')}
        description={t('settings.privacyDesc')}
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        }
      >
        <Toggle
          label={t('settings.showProfile')}
          description={t('settings.showProfileDesc')}
          enabled={settings.privacy.showProfile}
          onChange={(value) => updateSettings('privacy', 'showProfile', value)}
        />
        <Toggle
          label={t('settings.showEmail')}
          description={t('settings.showEmailDesc')}
          enabled={settings.privacy.showEmail}
          onChange={(value) => updateSettings('privacy', 'showEmail', value)}
        />
        <Toggle
          label={t('settings.showPhone')}
          description={t('settings.showPhoneDesc')}
          enabled={settings.privacy.showPhone}
          onChange={(value) => updateSettings('privacy', 'showPhone', value)}
        />
        <Toggle
          label={t('settings.activityStatus')}
          description={t('settings.activityStatusDesc')}
          enabled={settings.privacy.activityStatus}
          onChange={(value) => updateSettings('privacy', 'activityStatus', value)}
        />
      </SettingsSection>

      <SettingsSection
        title={t('settings.accessibility')}
        description={t('settings.accessibilityDesc')}
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      >
        <Toggle
          label={t('settings.reducedMotion')}
          description={t('settings.reducedMotionDesc')}
          enabled={settings.accessibility.reducedMotion}
          onChange={(value) => handleAccessibilityToggle('reducedMotion', value)}
        />
        <Toggle
          label={t('settings.highContrast')}
          description={t('settings.highContrastDesc')}
          enabled={settings.accessibility.highContrast}
          onChange={(value) => handleAccessibilityToggle('highContrast', value)}
        />
        <Toggle
          label={t('settings.largeText')}
          description={t('settings.largeTextDesc')}
          enabled={settings.accessibility.largeText}
          onChange={(value) => handleAccessibilityToggle('largeText', value)}
        />
      </SettingsSection>

      <SettingsSection
        title="Account"
        description="Security and profile management"
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        }
      >
        <div className="py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">Change password</p>
            <p className="text-xs text-ink-tertiary mt-0.5">Update your password to keep your account secure.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/change-password')}
            className="px-4 py-2 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150"
          >
            Update
          </button>
        </div>

        <div className="py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">Profile page</p>
            <p className="text-xs text-ink-tertiary mt-0.5">Open your full profile details page.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/profile')}
            className="px-4 py-2 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150"
          >
            Open
          </button>
        </div>

        <div className="py-4">
          <p className="text-xs text-ink-muted">Account created: {formatDate(user?.createdAt)}</p>
          <p className="text-xs text-ink-muted mt-1">Last login: {formatDate(user?.lastLogin)}</p>
        </div>
      </SettingsSection>

      <div className="flex items-center justify-end gap-3 pb-4">
        <button
          type="button"
          onClick={handleResetDefaults}
          disabled={isSaving || isPhotoPending}
          className="px-4 py-2.5 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150 disabled:opacity-50"
        >
          Reset to defaults
        </button>
        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={isSaving || isPhotoPending}
          className="px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

