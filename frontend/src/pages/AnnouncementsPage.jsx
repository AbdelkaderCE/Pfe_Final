/*
  AnnouncementsPage — modern SaaS-style announcements UI.
  Backend: /api/v1/annonces (unchanged). YouTube URLs are stored as plain
  text inside `contenu` and extracted on render — see utils/announcementMedia.
*/

import React, { useEffect, useMemo, useState } from 'react';
import request, { resolveMediaUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  resolvePrimaryMedia,
  stripYouTubeUrl,
  extractYouTubeId,
  embedYouTubeInContent,
} from '../utils/announcementMedia';

/* ── Display helpers ──────────────────────────────────────── */

const resolveText = (ar, en, fallback = '') => {
  if (typeof en === 'string' && en.trim()) return en.trim();
  if (typeof ar === 'string' && ar.trim()) return ar.trim();
  return fallback;
};

const getTitle = (item) => resolveText(item?.titre_ar, item?.titre_en, 'Untitled');
const getContent = (item) => resolveText(item?.contenu_ar, item?.contenu_en, '');
const getCategory = (item) => resolveText(item?.type?.nom_ar, item?.type?.nom_en, 'General');
const normalizePriority = (item) =>
  String(item?.priority ?? item?.priorite ?? 'normale').toLowerCase();

const PRIORITY_META = {
  urgente: { label: 'Urgent', badge: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20', dot: 'bg-red-500' },
  urgent: { label: 'Urgent', badge: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20', dot: 'bg-red-500' },
  haute: { label: 'Important', badge: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20', dot: 'bg-amber-500' },
  high: { label: 'Important', badge: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20', dot: 'bg-amber-500' },
  normale: { label: 'Normal', badge: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20', dot: 'bg-slate-400' },
  normal: { label: 'Normal', badge: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20', dot: 'bg-slate-400' },
  basse: { label: 'Low', badge: 'bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-400/20', dot: 'bg-slate-300' },
  low: { label: 'Low', badge: 'bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-400/20', dot: 'bg-slate-300' },
};

const priorityMeta = (item) => PRIORITY_META[normalizePriority(item)] || PRIORITY_META.normale;

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/* ── Media Indicator (per card) ───────────────────────────── */

/**
 * CardMedia — Refactored as a clean visual indicator.
 * Displays a subtle SVG icon (clip or play) to signal that an attachment exists.
 */
function CardMedia({ media }) {
  if (!media) return null;

  const config = {
    youtube: { 
      icon: <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      color: 'text-red-500',
      bg: 'bg-red-50'
    },
    video: { 
      icon: <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      color: 'text-brand',
      bg: 'bg-brand/10'
    },
    image: { 
      icon: <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    // Default fallback to "clip" icon for files/docs
    file: { 
      icon: <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />,
      color: 'text-slate-500',
      bg: 'bg-slate-100'
    }
  };

  const meta = config[media.kind] || config.file;

  return (
    <div 
      className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.bg} ${meta.color} transition-all duration-200 hover:scale-110 shadow-sm border border-black/5`}
      title={`${media.kind} attached`}
    >
      <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        {meta.icon}
      </svg>
    </div>
  );
}

/* ── Full Media Display (modal) ───────────────────────────── */

/**
 * FullMedia — Displays the actual attachment in the expanded view.
 * Constrained to 600px max-width as per UX architecture requirements.
 */
function FullMedia({ media }) {
  if (!media) return null;

  // Wrap common styles
  const Container = ({ children }) => (
    <div className="mx-auto w-full max-w-[600px] overflow-hidden rounded-xl border border-edge bg-slate-900 shadow-xl">
      {children}
    </div>
  );

  if (media.kind === 'youtube') {
    return (
      <Container>
        <div className="relative aspect-video w-full">
          <iframe
            src={media.embedUrl}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </Container>
    );
  }

  if (media.kind === 'video') {
    return (
      <Container>
        <video
          src={media.url}
          controls
          className="max-h-[50vh] w-full"
        />
      </Container>
    );
  }

  if (media.kind === 'image') {
    return (
      <div className="mx-auto w-full max-w-[600px] overflow-hidden rounded-xl border border-edge bg-surface-200 shadow-sm">
        <img
          src={media.url}
          alt="Announcement attachment"
          loading="eager"
          className="max-h-[60vh] w-auto max-w-full mx-auto object-contain"
        />
      </div>
    );
  }

  if (media.kind === 'pdf') {
    return (
      <div className="overflow-hidden rounded-xl border border-edge bg-white">
        <iframe
          src={media.url}
          title="PDF Document"
          className="h-[62vh] w-full border-0"
        />
        <div className="flex items-center justify-between border-t border-edge-subtle bg-slate-50 px-4 py-2.5">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">PDF Attachment</span>
          <a
            href={media.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-brand hover:underline"
          >
            Download ↓
          </a>
        </div>
      </div>
    );
  }

  // Fallback for DOC/Other files
  const iconColor = media.kind === 'doc' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 bg-slate-100';
  return (
    <a
      href={media.url}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 rounded-xl border border-edge bg-surface p-5 transition-all hover:bg-surface-200 hover:shadow-md"
    >
      <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{media.label || 'Attachment'}</p>
        <p className="text-sm text-slate-500">
          {media.kind === 'doc' ? 'Word document' : 'File'} — click to download
        </p>
      </div>
      <span className="flex-shrink-0 text-sm font-bold text-brand">Download ↓</span>
    </a>
  );
}

/* ── Featured Hero (Large card) ───────────────────────────── */

function FeaturedHero({ item, media, onExpand }) {
  if (!item || !media) return null;
  return (
    <section
      className="mb-10 cursor-pointer overflow-hidden rounded-2xl border border-edge bg-surface shadow-sm transition-all duration-200 hover:shadow-md hover:border-brand/30"
      onClick={() => onExpand?.(item)}
    >
      <div className="flex flex-col p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityMeta(item).badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${priorityMeta(item).dot}`} />
            {priorityMeta(item).label}
          </span>
          <span className="rounded-full bg-brand/5 px-2.5 py-0.5 text-xs font-medium text-brand ring-1 ring-inset ring-brand/10">
            {getCategory(item)}
          </span>
          <span className="ml-auto rounded-md bg-surface-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">
            Featured
          </span>
        </div>
        
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-ink md:text-3xl">
            {getTitle(item)}
          </h2>
          <CardMedia media={media} />
        </div>
        
        <p className="mb-6 text-sm text-ink-secondary leading-relaxed max-w-3xl line-clamp-3">
          {stripYouTubeUrl(getContent(item))}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-edge pt-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-surface-200 flex items-center justify-center text-ink-tertiary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <p className="text-xs text-ink-tertiary font-medium">
              {formatDate(item?.datePublication || item?.createdAt)}
            </p>
          </div>
          <span className="flex items-center gap-1 text-sm font-bold text-brand group-hover:underline">
            Read details 
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}

/* ── Standard Announcement Card ───────────────────────────── */

function AnnouncementCard({ item, isAdmin, onEdit, onDelete, onExpand }) {
  const media = useMemo(() => resolvePrimaryMedia(item, { resolveMediaUrl }), [item]);
  const body = useMemo(() => stripYouTubeUrl(getContent(item)), [item]);
  const meta = priorityMeta(item);

  return (
    <article
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-edge bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-brand/20"
      onClick={() => onExpand?.(item)}
    >
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {getCategory(item)}
          </span>
          
          {isAdmin && (
            <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand"
                title="Edit"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                title="Delete"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-3 min-h-[3rem]">
          <h3 className="line-clamp-2 text-lg font-bold leading-tight tracking-tight text-ink">
            {getTitle(item)}
          </h3>
          <CardMedia media={media} />
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-ink-secondary mb-2">
          {body || 'No description provided.'}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-edge pt-3 text-[11px] text-ink-tertiary font-medium">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {formatDate(item?.datePublication || item?.createdAt)}
          </span>
          <span className="font-bold text-brand group-hover:underline">View Details →</span>
        </div>
      </div>
    </article>
  );
}

/* ── Skeletons & States ───────────────────────────────────── */

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-surface p-5 shadow-sm">
      <div className="mb-4 aspect-video w-full animate-pulse rounded-xl bg-slate-200" />
      <div className="mb-3 flex gap-2">
        <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="mb-2 h-4 w-full animate-pulse rounded bg-slate-200" />
    </div>
  );
}

function EmptyState({ onCreate, canCreate }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-edge-strong bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
        <svg className="h-7 w-7 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      </div>
      <h3 className="mb-1 text-lg font-semibold text-ink">No announcements yet</h3>
      <p className="mb-4 text-sm text-slate-500">
        {canCreate
          ? 'Create your first announcement to share news, events, or important updates.'
          : 'Check back later for updates.'}
      </p>
      {canCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 shadow-md"
        >
          New Announcement
        </button>
      )}
    </div>
  );
}

/* ── Modals ────────────────────────────────────────────────── */

const CATEGORY_OPTIONS = ['Administrative', 'Academic', 'Events', 'Research', 'Student Life'];
const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
  { value: 'high', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
];

function AnnouncementModal({ open, initial, onClose, onSaved }) {
  const isEdit = Boolean(initial?.id);

  const initialYoutubeUrl = useMemo(() => {
    if (!initial) return '';
    const ytId = extractYouTubeId(getContent(initial));
    return ytId ? `https://www.youtube.com/watch?v=${ytId}` : '';
  }, [initial]);

  const [form, setForm] = useState({
    titre: '',
    contenu: '',
    typeAnnonce: 'Administrative',
    priority: 'normal',
    youtubeUrl: '',
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setFile(null);
    setForm({
      titre: getTitle(initial) === 'Untitled' ? '' : getTitle(initial),
      contenu: stripYouTubeUrl(getContent(initial)),
      typeAnnonce: getCategory(initial) === 'General' ? 'Administrative' : getCategory(initial),
      priority:
        normalizePriority(initial) === 'urgente' || normalizePriority(initial) === 'urgent' ? 'urgent'
          : normalizePriority(initial) === 'haute' || normalizePriority(initial) === 'high' ? 'high'
          : normalizePriority(initial) === 'basse' || normalizePriority(initial) === 'low' ? 'low'
          : 'normal',
      youtubeUrl: initialYoutubeUrl,
    });
  }, [open, initial, initialYoutubeUrl]);

  if (!open) return null;

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.titre.trim() || !form.contenu.trim()) {
      setError('Title and content are required.');
      return;
    }
    setSubmitting(true);
    try {
      const mergedContent = embedYouTubeInContent(form.contenu, form.youtubeUrl);

      if (isEdit) {
        await request(`/api/v1/annonces/${initial.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            titre: form.titre,
            contenu: mergedContent,
            typeAnnonce: form.typeAnnonce,
            priority: form.priority,
          }),
        });
      } else {
        const payload = new FormData();
        payload.append('titre', form.titre);
        payload.append('contenu', mergedContent);
        payload.append('typeAnnonce', form.typeAnnonce);
        payload.append('priority', form.priority);
        if (file) payload.append('file', file);

        await request('/api/v1/annonces', {
          method: 'POST',
          body: payload,
        });
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-edge px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">
            {isEdit ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Title *</label>
              <input
                type="text"
                required
                value={form.titre}
                onChange={setField('titre')}
                placeholder="Announcement title"
                className="w-full rounded-lg border border-control-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={form.typeAnnonce}
                  onChange={setField('typeAnnonce')}
                  className="w-full rounded-lg border border-control-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</label>
                <select
                  value={form.priority}
                  onChange={setField('priority')}
                  className="w-full rounded-lg border border-control-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Content *</label>
              <textarea
                required
                rows={5}
                value={form.contenu}
                onChange={setField('contenu')}
                placeholder="Description..."
                className="w-full resize-none rounded-lg border border-control-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">YouTube URL</label>
              <input
                type="url"
                value={form.youtubeUrl}
                onChange={setField('youtubeUrl')}
                placeholder="https://..."
                className="w-full rounded-lg border border-control-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {!isEdit && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Attachment</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-brand hover:file:bg-brand/20"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-edge bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-edge-strong bg-surface px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-md"
            >
              {submitting ? 'Saving...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Announcement Detail Modal ────────────────────────────── */

function AnnouncementDetailModal({ item, onClose }) {
  const media = useMemo(() => resolvePrimaryMedia(item, { resolveMediaUrl }), [item]);
  const body = useMemo(() => stripYouTubeUrl(getContent(item)), [item]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item) return null;

  const meta = priorityMeta(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-edge px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${meta.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              {getCategory(item)}
            </span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-ink mb-2">
            {getTitle(item)}
          </h2>
          <p className="text-xs text-ink-tertiary mb-6">
            Published on {formatDate(item?.datePublication || item?.createdAt)}
          </p>

          {media && (
            <div className="mb-8">
              <FullMedia media={media} />
            </div>
          )}

          {body && (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
                {body}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const isAdmin = useMemo(() => Array.isArray(user?.roles) && user.roles.includes('admin'), [user]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await request('/api/v1/annonces');
      setItems(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = useMemo(() => {
    if (!category) return items;
    return items.filter((x) => getCategory(x) === category);
  }, [items, category]);

  const { featured, grid } = useMemo(() => {
    if (!filtered.length) return { featured: null, grid: [] };
    const featuredCandidate = filtered.find((item) => {
      const media = resolvePrimaryMedia(item, { resolveMediaUrl });
      return media && (media.kind === 'youtube' || media.kind === 'video');
    });
    if (!featuredCandidate) return { featured: null, grid: filtered };
    return {
      featured: { item: featuredCandidate, media: resolvePrimaryMedia(featuredCandidate, { resolveMediaUrl }) },
      grid: filtered.filter((x) => x.id !== featuredCandidate.id),
    };
  }, [filtered]);

  const categories = useMemo(() => {
    const set = new Set(items.map(getCategory).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [items]);

  const handleEdit = (item) => { setEditing(item); setModalOpen(true); };
  const handleCreate = () => { setEditing(null); setModalOpen(true); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await request(`/api/v1/annonces/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (err) { window.alert(err?.message || 'Delete failed.'); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Announcements</h1>
            <p className="mt-2 text-sm text-slate-600">News, events, and important university updates.</p>
          </div>
          {isAdmin && (
            <button onClick={handleCreate} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700">
              New Announcement
            </button>
          )}
        </header>

        {!loading && items.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c === 'All' ? '' : c)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  (category === c || (c === 'All' && !category))
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink-secondary ring-1 ring-edge hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreate={handleCreate} canCreate={isAdmin} />
        ) : (
          <>
            {featured && <FeaturedHero item={featured.item} media={featured.media} onExpand={setDetail} />}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((item) => (
                <AnnouncementCard key={item.id} item={item} isAdmin={isAdmin} onEdit={handleEdit} onDelete={handleDelete} onExpand={setDetail} />
              ))}
            </div>
          </>
        )}
      </div>

      <AnnouncementModal open={modalOpen} initial={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={fetchItems} />
      <AnnouncementDetailModal item={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
