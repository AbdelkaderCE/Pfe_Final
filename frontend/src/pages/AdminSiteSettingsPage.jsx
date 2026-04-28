/*
  Admin → Site Configuration
  Centralized super-admin panel to customize the platform.

  Sections (tabs):
    1. General        — university identity & contact (string fields)
    2. Theme          — mode (light/dark), accent color, sidebar palette  → ThemeProvider (instant)
    3. Media          — logo / hero / banner uploads via siteSettingsAPI
    4. UI Preferences — feature toggles persisted in localStorage (siteUIPrefs)
    5. Statistics     — public counters shown across the site

  Persistence:
    - Content fields  → PATCH /api/v1/site-settings
    - Media files     → POST  /api/v1/site-settings/media/:kind
    - Theme           → ThemeProvider (localStorage, applied instantly to <html>)
    - UI prefs        → localStorage via lib/siteUIPrefs (HTML class flags)
*/

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Settings2,
  Palette,
  Image as ImageIcon,
  SlidersHorizontal,
  BarChart3,
  Save,
  RotateCcw,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { resolveMediaUrl, siteSettingsAPI } from '../services/api';
import { useSiteSettings, DEFAULT_SITE_SETTINGS } from '../contexts/SiteSettingsContext';
import { useTheme } from '../theme/ThemeProvider';
import {
  applyUIPrefsToDocument,
  DEFAULT_UI_PREFS,
  readUIPrefs,
  writeUIPrefs,
} from '../lib/siteUIPrefs';
import {
  SettingsTabs,
  FormField,
  ToggleSwitch,
  MediaUploader,
  StatusBanner,
  AccentPicker,
  LivePreview,
} from '../components/admin/site-settings';

const TABS = [
  {
    id: 'general',
    label: 'General',
    description: 'Identity & contact details',
    icon: Settings2,
  },
  {
    id: 'theme',
    label: 'Theme',
    description: 'Colors, mode, branding',
    icon: Palette,
  },
  {
    id: 'media',
    label: 'Media',
    description: 'Logo, hero & banner images',
    icon: ImageIcon,
  },
  {
    id: 'statistics',
    label: 'Statistics',
    description: 'Public counters',
    icon: BarChart3,
  },
  {
    id: 'ui',
    label: 'UI Preferences',
    description: 'Toggles & feature flags',
    icon: SlidersHorizontal,
  },
];

const GENERAL_FIELDS = [
  { key: 'universityNameEn', label: 'Site Name (EN)' },
  { key: 'universityNameFr', label: 'Site Name (FR)' },
  { key: 'universityNameAr', label: 'Site Name (AR)' },
  { key: 'universitySubtitleEn', label: 'Description (EN)', multiline: true },
  { key: 'universitySubtitleFr', label: 'Description (FR)', multiline: true },
  { key: 'universitySubtitleAr', label: 'Description (AR)', multiline: true },
  { key: 'cityEn', label: 'City (EN)' },
  { key: 'cityFr', label: 'City (FR)' },
  { key: 'cityAr', label: 'City (AR)' },
  { key: 'contactPhone', label: 'Contact Phone' },
  { key: 'contactEmail', label: 'Contact Email', type: 'email' },
  { key: 'contactAddressEn', label: 'Address (EN)' },
  { key: 'contactAddressFr', label: 'Address (FR)' },
  { key: 'contactAddressAr', label: 'Address (AR)' },
  { key: 'aboutLine1En', label: 'Footer Line 1 (EN)', multiline: true },
  { key: 'aboutLine1Fr', label: 'Footer Line 1 (FR)', multiline: true },
  { key: 'aboutLine1Ar', label: 'Footer Line 1 (AR)', multiline: true },
  { key: 'aboutLine2En', label: 'Footer Line 2 (EN)', multiline: true },
  { key: 'aboutLine2Fr', label: 'Footer Line 2 (FR)', multiline: true },
  { key: 'aboutLine2Ar', label: 'Footer Line 2 (AR)', multiline: true },
];

const STATS_FIELDS = [
  { key: 'heroStudentsStat', label: 'Hero — Students' },
  { key: 'heroTeachersStat', label: 'Hero — Teachers' },
  { key: 'heroCoursesStat', label: 'Hero — Courses' },
  { key: 'heroSatisfactionStat', label: 'Hero — Satisfaction' },
  { key: 'bannerStudentsStat', label: 'Banner — Students' },
  { key: 'bannerTeachersStat', label: 'Banner — Teachers' },
  { key: 'bannerFacultiesStat', label: 'Banner — Faculties' },
  { key: 'bannerNationalRankStat', label: 'Banner — National Rank' },
  { key: 'statisticsStudentsStat', label: 'Stats — Students' },
  { key: 'statisticsTeachersStat', label: 'Stats — Teachers' },
  { key: 'statisticsProjectsStat', label: 'Stats — Projects' },
  { key: 'statisticsSatisfactionStat', label: 'Stats — Satisfaction' },
  { key: 'statisticsQuoteEn', label: 'Stats Quote (EN)', multiline: true },
  { key: 'statisticsQuoteFr', label: 'Stats Quote (FR)', multiline: true },
  { key: 'statisticsQuoteAr', label: 'Stats Quote (AR)', multiline: true },
];

const MEDIA_ITEMS = [
  {
    kind: 'logo',
    field: 'logoUrl',
    title: 'University Logo',
    description: 'Displayed in the navbar, dashboard sidebar, and footer.',
  },
  {
    kind: 'hero',
    field: 'heroBackgroundUrl',
    title: 'Hero Background',
    description: 'Full-width image behind the homepage headline.',
  },
  {
    kind: 'banner',
    field: 'bannerBackgroundUrl',
    title: 'Banner Background',
    description: 'Background for marketing banners and stat ribbons.',
  },
];

const ALL_TRACKED_KEYS = [...GENERAL_FIELDS, ...STATS_FIELDS].map((f) => f.key);

const isValidEmail = (value) =>
  !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

function normalizeForCompare(value) {
  return value === null || value === undefined ? '' : String(value);
}

function diffSettings(current, baseline) {
  const dirty = {};
  ALL_TRACKED_KEYS.forEach((key) => {
    if (normalizeForCompare(current[key]) !== normalizeForCompare(baseline[key])) {
      dirty[key] = current[key] ?? '';
    }
  });
  return dirty;
}

function pickTrackedSettings(source) {
  const out = {};
  ALL_TRACKED_KEYS.forEach((key) => {
    out[key] = source?.[key] ?? '';
  });
  return out;
}

export default function AdminSiteSettingsPage() {
  const { settings: contextSettings, setSettings: setContextSettings } = useSiteSettings();
  const {
    mode,
    accent,
    sidebarColor,
    setMode,
    setAccent,
    setSidebarColor,
    accents,
    sidebarColors,
    isDark,
  } = useTheme();

  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState(() => pickTrackedSettings(contextSettings));
  const [baseline, setBaseline] = useState(() => pickTrackedSettings(contextSettings));
  const [media, setMedia] = useState({
    logoUrl: contextSettings.logoUrl || null,
    heroBackgroundUrl: contextSettings.heroBackgroundUrl || null,
    bannerBackgroundUrl: contextSettings.bannerBackgroundUrl || null,
  });
  const [pendingFiles, setPendingFiles] = useState({ logo: null, hero: null, banner: null });
  const [uiPrefs, setUiPrefs] = useState(() => readUIPrefs());
  const [uiPrefsBaseline, setUiPrefsBaseline] = useState(() => readUIPrefs());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Apply UI prefs immediately on mount so flags reflect what's stored.
  useEffect(() => {
    applyUIPrefsToDocument(uiPrefs);
    // Intentionally run once on mount; later updates handled in handleUiPrefChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load fresh settings from the API (independent from context's initial fetch).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await siteSettingsAPI.getPublic();
        const data = response?.data || {};
        if (cancelled) return;
        const tracked = pickTrackedSettings(data);
        setForm(tracked);
        setBaseline(tracked);
        setMedia({
          logoUrl: data.logoUrl ?? null,
          heroBackgroundUrl: data.heroBackgroundUrl ?? null,
          bannerBackgroundUrl: data.bannerBackgroundUrl ?? null,
        });
        setContextSettings((prev) => ({ ...prev, ...data }));
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Failed to load site settings.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [setContextSettings]);

  const dirtyFields = useMemo(() => diffSettings(form, baseline), [form, baseline]);
  const hasContentChanges = Object.keys(dirtyFields).length > 0;
  const hasUiChanges = useMemo(
    () =>
      Object.keys(DEFAULT_UI_PREFS).some(
        (key) => Boolean(uiPrefs[key]) !== Boolean(uiPrefsBaseline[key])
      ),
    [uiPrefs, uiPrefsBaseline]
  );

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleUiPrefChange = (key, value) => {
    setUiPrefs((prev) => {
      const next = { ...prev, [key]: value };
      applyUIPrefsToDocument(next);
      return next;
    });
  };

  const handleResetUI = () => {
    setUiPrefs(uiPrefsBaseline);
    applyUIPrefsToDocument(uiPrefsBaseline);
  };

  const handleResetContent = () => {
    setForm(baseline);
    setFieldErrors({});
  };

  const handleResetToDefaults = () => {
    const defaults = pickTrackedSettings(DEFAULT_SITE_SETTINGS);
    setForm(defaults);
    setFieldErrors({});
    setSuccessMessage('Reverted form to system defaults — review then save to apply.');
    setError('');
  };

  const handleSelectMediaFile = (kind, file) => {
    setPendingFiles((prev) => ({ ...prev, [kind]: file }));
    setError('');
    setSuccessMessage('');
  };

  const handleUploadMedia = async (kind) => {
    const file = pendingFiles[kind];
    if (!file) return;
    setUploadingKind(kind);
    setError('');
    setSuccessMessage('');
    try {
      const response = await siteSettingsAPI.uploadMedia(kind, file);
      const data = response?.data || {};
      setMedia({
        logoUrl: data.logoUrl ?? null,
        heroBackgroundUrl: data.heroBackgroundUrl ?? null,
        bannerBackgroundUrl: data.bannerBackgroundUrl ?? null,
      });
      setContextSettings((prev) => ({ ...prev, ...data }));
      setPendingFiles((prev) => ({ ...prev, [kind]: null }));
      setSuccessMessage(`${kind === 'logo' ? 'Logo' : kind === 'hero' ? 'Hero background' : 'Banner background'} updated.`);
    } catch (uploadError) {
      setError(uploadError.message || 'Failed to upload media.');
    } finally {
      setUploadingKind('');
    }
  };

  const handleClearMedia = async (kind, field) => {
    // Clearing simply blanks the URL field via PATCH (server stores null when empty).
    setUploadingKind(kind);
    setError('');
    setSuccessMessage('');
    try {
      const response = await siteSettingsAPI.update({ [field]: '' });
      const data = response?.data || {};
      setMedia({
        logoUrl: data.logoUrl ?? null,
        heroBackgroundUrl: data.heroBackgroundUrl ?? null,
        bannerBackgroundUrl: data.bannerBackgroundUrl ?? null,
      });
      setContextSettings((prev) => ({ ...prev, ...data }));
      setSuccessMessage('Media reference cleared.');
    } catch (clearError) {
      setError(clearError.message || 'Failed to clear media.');
    } finally {
      setUploadingKind('');
    }
  };

  const validateContent = () => {
    const errors = {};
    if (!isValidEmail(form.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError('Please correct the highlighted fields.');
      return false;
    }
    return true;
  };

  const handleSaveContent = async () => {
    if (!hasContentChanges) return;
    if (!validateContent()) return;

    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await siteSettingsAPI.update(dirtyFields);
      const data = response?.data || {};
      const tracked = pickTrackedSettings(data);
      setForm(tracked);
      setBaseline(tracked);
      setContextSettings((prev) => ({ ...prev, ...data }));
      setSuccessMessage('Site settings saved successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Failed to save site settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUiPrefs = () => {
    writeUIPrefs(uiPrefs);
    setUiPrefsBaseline(uiPrefs);
    setSuccessMessage('UI preferences saved.');
    setError('');
  };

  const previewLanguage = 'en';
  const previewName = form.universityNameEn || DEFAULT_SITE_SETTINGS.universityNameEn;
  const previewSubtitle = form.universitySubtitleEn || DEFAULT_SITE_SETTINGS.universitySubtitleEn;
  const previewCity = form.cityEn || DEFAULT_SITE_SETTINGS.cityEn;
  const heroPreviewUrl = pendingFiles.hero
    ? URL.createObjectURL(pendingFiles.hero)
    : resolveMediaUrl(media.heroBackgroundUrl);
  const logoPreviewUrl = pendingFiles.logo
    ? URL.createObjectURL(pendingFiles.logo)
    : resolveMediaUrl(media.logoUrl);

  const renderFieldGrid = (fields) => (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((field) => (
        <FormField
          key={field.key}
          label={field.label}
          type={field.type || 'text'}
          multiline={Boolean(field.multiline)}
          rows={field.rows || 3}
          value={form[field.key] ?? ''}
          onChange={(value) => handleFieldChange(field.key, value)}
          disabled={loading || saving}
          error={fieldErrors[field.key]}
        />
      ))}
    </div>
  );

  return (
    <div className="min-w-0 max-w-7xl space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-brand/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">
              Administration
            </p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold tracking-tight text-ink">
              <Sparkles className="h-6 w-6 text-brand" strokeWidth={2} />
              Site Configuration
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
              Centralized control panel — manage branding, theme, media, and feature toggles
              from one place. Theme & UI changes apply instantly; content changes save to the API.
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Admin Hub
          </Link>
        </div>
      </section>

      <StatusBanner
        variant="error"
        message={error}
        onDismiss={() => setError('')}
      />
      <StatusBanner
        variant="success"
        message={successMessage}
        onDismiss={() => setSuccessMessage('')}
        autoDismissMs={4000}
      />

      {/* ── Two-column layout: tabs + content ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <SettingsTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          <div className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
              Pending changes
            </p>
            <div className="mt-2 space-y-1 text-xs text-ink-secondary">
              <div className="flex items-center justify-between">
                <span>Content fields</span>
                <span className={hasContentChanges ? 'font-semibold text-brand' : 'text-ink-tertiary'}>
                  {Object.keys(dirtyFields).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>UI prefs</span>
                <span className={hasUiChanges ? 'font-semibold text-brand' : 'text-ink-tertiary'}>
                  {hasUiChanges ? 'Modified' : 'Saved'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {activeTab === 'general' ? (
            <SectionShell
              title="General Settings"
              description="University identity, contact details, and footer copy in all three languages."
              icon={Settings2}
              footer={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleResetContent}
                    disabled={!hasContentChanges || loading || saving}
                    className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={2} />
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    disabled={loading || saving}
                    className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-warning/40 hover:text-warning disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reset to defaults
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveContent}
                    disabled={!hasContentChanges || loading || saving}
                    className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" strokeWidth={2} />
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              }
            >
              {loading ? <LoadingSkeleton /> : renderFieldGrid(GENERAL_FIELDS)}
            </SectionShell>
          ) : null}

          {activeTab === 'theme' ? (
            <>
              <SectionShell
                title="Appearance Mode"
                description="Switch between light and dark themes — applied instantly."
                icon={mode === 'dark' ? Moon : Sun}
              >
                <div className="inline-flex rounded-lg bg-surface-200 p-1">
                  {[
                    { key: 'light', label: 'Light', Icon: Sun },
                    { key: 'dark', label: 'Dark', Icon: Moon },
                  ].map((m) => {
                    const isActive = mode === m.key;
                    const Icon = m.Icon;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setMode(m.key)}
                        className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-brand text-white shadow-sm'
                            : 'text-ink-secondary hover:text-ink'
                        }`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </SectionShell>

              <SectionShell
                title="Brand Color"
                description="Primary accent — affects buttons, links, focus rings, and active states."
                icon={Palette}
              >
                <AccentPicker
                  accents={accents}
                  value={accent}
                  onChange={setAccent}
                  isDark={isDark}
                  label="Primary accent"
                />
                <div className="mt-6">
                  <AccentPicker
                    accents={sidebarColors}
                    value={sidebarColor}
                    onChange={setSidebarColor}
                    isDark={isDark}
                    label="Sidebar color"
                  />
                  <p className="mt-2 text-xs text-ink-tertiary">
                    Applies to the dashboard sidebar across all roles.
                  </p>
                </div>
              </SectionShell>

              <SectionShell
                title="Live Preview"
                description="Reflects the brand, mode, and identity changes you have currently selected."
                icon={Eye}
              >
                <LivePreview
                  universityName={previewName}
                  subtitle={previewSubtitle}
                  city={previewCity}
                  logoUrl={logoPreviewUrl}
                  heroBackgroundUrl={heroPreviewUrl}
                  primaryStat={form.heroStudentsStat || '—'}
                  primaryStatLabel="Students"
                  showAnimations={uiPrefs.enableAnimations}
                />
              </SectionShell>
            </>
          ) : null}

          {activeTab === 'media' ? (
            <SectionShell
              title="Media Management"
              description="Upload or replace branded imagery. Files are validated client-side before upload."
              icon={ImageIcon}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {MEDIA_ITEMS.map((item) => (
                  <MediaUploader
                    key={item.kind}
                    title={item.title}
                    description={item.description}
                    currentImageUrl={resolveMediaUrl(media[item.field])}
                    selectedFile={pendingFiles[item.kind]}
                    onSelectFile={(file) => handleSelectMediaFile(item.kind, file)}
                    onUpload={() => handleUploadMedia(item.kind)}
                    onClear={() => handleClearMedia(item.kind, item.field)}
                    uploading={uploadingKind === item.kind}
                    disabled={loading}
                  />
                ))}
              </div>
            </SectionShell>
          ) : null}

          {activeTab === 'statistics' ? (
            <SectionShell
              title="Public Statistics"
              description="Counters and quotes displayed on the homepage and marketing banners."
              icon={BarChart3}
              footer={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleResetContent}
                    disabled={!hasContentChanges || loading || saving}
                    className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={2} />
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveContent}
                    disabled={!hasContentChanges || loading || saving}
                    className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" strokeWidth={2} />
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              }
            >
              {loading ? <LoadingSkeleton /> : renderFieldGrid(STATS_FIELDS)}
            </SectionShell>
          ) : null}

          {activeTab === 'ui' ? (
            <SectionShell
              title="UI Preferences"
              description="Toggle features and layout flags. Stored locally per browser; saved instantly when applied."
              icon={SlidersHorizontal}
              footer={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleResetUI}
                    disabled={!hasUiChanges}
                    className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={2} />
                    Revert
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUiPrefs}
                    disabled={!hasUiChanges}
                    className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" strokeWidth={2} />
                    Save preferences
                  </button>
                </div>
              }
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleSwitch
                  label="Enable animations"
                  description="Hover effects, fade-ins, and motion across the platform."
                  checked={uiPrefs.enableAnimations}
                  onChange={(value) => handleUiPrefChange('enableAnimations', value)}
                />
                <ToggleSwitch
                  label="Show homepage hero"
                  description="Toggle the headline hero section on the public homepage."
                  checked={uiPrefs.showHeroSection}
                  onChange={(value) => handleUiPrefChange('showHeroSection', value)}
                />
                <ToggleSwitch
                  label="Show statistics banner"
                  description="Display the counters strip on the homepage."
                  checked={uiPrefs.showStatsBanner}
                  onChange={(value) => handleUiPrefChange('showStatsBanner', value)}
                />
                <ToggleSwitch
                  label="Show news (Actualités) section"
                  description="Reveal the latest news on the homepage."
                  checked={uiPrefs.showActualites}
                  onChange={(value) => handleUiPrefChange('showActualites', value)}
                />
                <ToggleSwitch
                  label="Compact sidebar"
                  description="Use the dense layout for the dashboard sidebar."
                  checked={uiPrefs.compactSidebar}
                  onChange={(value) => handleUiPrefChange('compactSidebar', value)}
                />
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-edge bg-canvas/50 px-4 py-3">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-ink-tertiary" strokeWidth={2} />
                <p className="text-xs text-ink-secondary">
                  These preferences are stored in your browser only. To roll out platform-wide
                  defaults, hook the toggles into the API in a follow-up — the helper in
                  <code className="mx-1 rounded bg-surface-200 px-1 py-0.5 text-[11px]">
                    src/lib/siteUIPrefs.js
                  </code>
                  is the single source of truth and applies the matching CSS flags to
                  <code className="mx-1 rounded bg-surface-200 px-1 py-0.5 text-[11px]">&lt;html&gt;</code>.
                </p>
              </div>
            </SectionShell>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionShell({ title, description, icon: Icon, footer, children }) {
  return (
    <section className="rounded-2xl border border-edge bg-surface shadow-sm">
      <header className="flex items-start gap-3 border-b border-edge-subtle px-6 py-4">
        {Icon ? (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-ink-secondary">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="px-6 py-5">{children}</div>
      {footer ? (
        <footer className="border-t border-edge-subtle bg-canvas/40 px-6 py-3">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="space-y-2">
          <div className="h-3 w-24 skeleton" />
          <div className="h-10 w-full skeleton" />
        </div>
      ))}
    </div>
  );
}
