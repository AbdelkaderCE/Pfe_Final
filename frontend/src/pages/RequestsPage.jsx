/*
  Intent: Student and teacher portal for submitting Reclamations and Justifications.
    Admin accounts use this route only for the Student Inbox processing view.
    File upload + optional identity fields for guests/staff.
  Access: Student → full access (Justifications + Reclamations).
    Teacher → Reclamation submission.
    Admin → Student Inbox only (no reclamation submission).
  Palette: canvas base, surface cards. Brand/blue for reclamations, emerald for justifications.
  Depth: shadow-card + border-edge on cards.
  Typography: Inter. Section headings = text-base font-semibold. Body = text-sm.
  Spacing: 4px base. Cards p-6. gap-6 between sections.
*/

import React, { useState, useEffect, useRef } from 'react';
import RequestDetailPage from './RequestDetailPage';
import AdminRequestsPage from './AdminRequestsPage';
import request from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ── Helpers ────────────────────────────────────────────────── */

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - new Date('2026-02-24').getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatFileSize(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return 'N/A';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function inferFileCategory(file) {
  const mime = String(file?.type || '').toLowerCase();
  const extension = String(file?.name || '').split('.').pop()?.toLowerCase() || '';

  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(extension)) {
    return 'Image';
  }

  if (mime === 'application/pdf' || extension === 'pdf') {
    return 'PDF';
  }

  if (mime.startsWith('text/') || extension === 'txt') {
    return 'Text';
  }

  return 'Document';
}

function mergeFiles(currentFiles, incomingFiles) {
  const map = new Map();

  [...(Array.isArray(currentFiles) ? currentFiles : []), ...(Array.isArray(incomingFiles) ? incomingFiles : [])]
    .forEach((file) => {
      if (!file) return;
      const key = `${file.name || 'file'}-${file.size || 0}-${file.lastModified || 0}`;
      if (!map.has(key)) {
        map.set(key, file);
      }
    });

  return Array.from(map.values());
}

function normalizeStatus(rawStatus) {
  const s = String(rawStatus || '').toLowerCase();
  if (['soumise', 'soumis', 'submitted'].includes(s)) return 'submitted';
  if (['en_cours', 'en_verification', 'under-review', 'under_review'].includes(s)) return 'under-review';
  if (['traitee', 'valide', 'resolved'].includes(s)) return 'resolved';
  if (['refusee', 'refuse', 'rejected'].includes(s)) return 'rejected';
  return 'submitted';
}

function normalizeReclamation(item) {
  return {
    id: item?.id,
    category: 'reclamation',
    status: normalizeStatus(item?.status),
    title: item?.objet || item?.objet_ar || item?.objet_en || 'Reclamation',
    type: item?.type?.nom || item?.type?.nom_ar || item?.type?.nom_en || 'Reclamation',
    nom: item?.etudiant?.user?.nom || '',
    prenom: item?.etudiant?.user?.prenom || '',
    dateSubmitted: item?.createdAt || item?.dateReclamation || null,
    lastUpdated: item?.updatedAt || item?.createdAt || null,
    description: item?.description || item?.description_ar || item?.description_en || '',
    timeline: item?.timeline || [],
    attachments: item?.attachments || [],
    adminResponse: item?.adminResponse || null,
    source: item,
  };
}

function normalizeJustification(item) {
  return {
    id: item?.id,
    category: 'justification',
    status: normalizeStatus(item?.status),
    title: item?.motif || item?.motif_ar || item?.motif_en || 'Absence Justification',
    type: item?.type?.nom || item?.type?.nom_ar || item?.type?.nom_en || 'Justification',
    nom: item?.etudiant?.user?.nom || '',
    prenom: item?.etudiant?.user?.prenom || '',
    dateSubmitted: item?.createdAt || item?.dateAbsence || null,
    lastUpdated: item?.updatedAt || item?.createdAt || null,
    description: item?.motif || item?.motif_ar || item?.motif_en || item?.description || '',
    timeline: item?.timeline || [],
    attachments: item?.attachments || [],
    adminResponse: item?.adminResponse || null,
    source: item,
  };
}

/* ── Mock Data — Reclamations ───────────────────────────────── */
/* Data fetched from API — see component useEffect */

/* ── Status Config ──────────────────────────────────────────── */

const STATUS_CONFIG = {
  draft:          { label: 'Draft',        bg: 'bg-surface-200',                        text: 'text-ink-tertiary', border: 'border-edge',                               dot: 'bg-ink-muted'  },
  submitted:      { label: 'Submitted',    bg: 'bg-brand-light',                         text: 'text-brand',        border: 'border-edge-strong',                           dot: 'bg-brand'      },
  'under-review': { label: 'Under Review', bg: 'bg-warning/50',                          text: 'text-warning',      border: 'border-warning/50',                         dot: 'bg-warning'    },
  resolved:       { label: 'Resolved',     bg: 'bg-success/50',                          text: 'text-success',      border: 'border-success/50',                         dot: 'bg-success'    },
  rejected:       { label: 'Rejected',     bg: 'bg-danger/50',                           text: 'text-danger',       border: 'border-danger/50',                          dot: 'bg-danger'     },
};

/* ── Type Options ───────────────────────────────────────────── */

const RECLAMATION_TYPES = [
  { value: '', label: 'Select a type…' },
  { value: 'Grade Error', label: 'Grade Error' },
  { value: 'Schedule Conflict', label: 'Schedule Conflict' },
  { value: 'Administrative Error', label: 'Administrative Error' },
  { value: 'Other', label: 'Other' },
];

const JUSTIFICATION_TYPES = [
  { value: '', label: 'Select a type…' },
  { value: 'Medical', label: 'Medical' },
  { value: 'Family Emergency', label: 'Family Emergency' },
  { value: 'Academic', label: 'Academic Overlap' },
  { value: 'Administrative', label: 'Administrative Reason' },
  { value: 'Other', label: 'Other' },
];

/* ═══════════════════════════════════════════════════════════════
   ██  SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatusTracker({ status }) {
  const steps = ['submitted', 'under-review', 'resolved'];
  const currentIdx = status === 'rejected' ? 2 : steps.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${
            status === 'rejected' && i === 2
              ? 'border-danger bg-danger'
              : i <= currentIdx
                ? 'border-brand bg-brand'
                : 'border-edge bg-surface'
          }`} />
          {i < steps.length - 1 && (
            <div className={`w-6 h-0.5 rounded-full transition-colors ${
              i < currentIdx ? 'bg-brand' : 'bg-edge'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function StatCard({ label, value, accent, icon }) {
  const accents = {
    brand:   'bg-brand-light text-brand',
    warning: 'bg-warning/50 text-warning',
    success: 'bg-success/50 text-success',
    danger:  'bg-danger/50 text-danger',
    emerald: 'bg-success/10 text-success',
  };
  return (
    <div className="rounded-lg border border-edge bg-surface p-5 shadow-card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${accents[accent] || accents.brand} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-ink tracking-tight">{value}</p>
        <p className="text-xs text-ink-tertiary mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function FileIcon({ type }) {
  if (type === 'Image') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

/* ── Category Badge ──────────────────────────────────────────── */

function CategoryBadge({ category }) {
  if (category === 'reclamation') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        Reclamation
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
      Justification
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ██  FILE UPLOAD ZONE (reusable)
   ═══════════════════════════════════════════════════════════════ */

function FileUploadZone({ files, setFiles, dragActive, setDragActive, fileInputRef, accentColor }) {
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files || []);
      setFiles((prev) => mergeFiles(prev, droppedFiles));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
      const selectedFiles = Array.from(e.target.files || []);
      setFiles((prev) => mergeFiles(prev, selectedFiles));
      e.target.value = '';
    }
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const borderActive = accentColor === 'emerald'
    ? 'border-success/40 bg-success/10'
    : 'border-edge-strong bg-brand-light';

  return (
    <div>
      <label className="block text-sm font-medium text-ink-secondary mb-1.5">
        Supporting Documents
      </label>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-150 ${
          dragActive ? borderActive : 'border-control-border bg-control-bg hover:border-ink-muted'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <svg className="w-8 h-8 text-ink-muted mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-ink-secondary">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`font-medium transition-colors ${
              accentColor === 'emerald'
                ? 'text-success hover:opacity-80'
                : 'text-brand hover:text-brand-hover'
            }`}
          >
            Browse files
          </button>
          {' '}or drag and drop
        </p>
        <p className="text-xs text-ink-muted mt-1">PDF, JPG, PNG — up to 10 MB per file</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.txt,.zip"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, idx) => (
            <li key={`${file.name || 'file'}-${file.size || 0}-${file.lastModified || idx}`} className="flex items-center gap-3 px-3 py-2 bg-surface-200 rounded-md">
              <div className="w-7 h-7 rounded bg-surface flex items-center justify-center text-ink-tertiary shrink-0">
                <FileIcon type={inferFileCategory(file)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{file.name}</p>
                <p className="text-xs text-ink-muted">{inferFileCategory(file)} · {formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="p-1 rounded text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ██  MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function RequestsPage({ role = 'student' }) {
  const { user } = useAuth();
  const roleList = Array.isArray(user?.roles) ? user.roles.map((r) => String(r || '').toLowerCase()) : [];
  const hasStudentRole = roleList.includes('etudiant');
  const hasTeacherRole = roleList.includes('enseignant');
  const hasAdminRole = roleList.includes('admin');
  const isAdminInboxOnlyView = hasAdminRole && !hasStudentRole;
  const canAccessAdminInbox = hasAdminRole;
  const isGuest = role === 'guest';
  const shouldUseProfileIdentity = !isGuest && hasStudentRole;

  /* ─── State (all hooks MUST be above any early return) ───── */
  const [view, setView] = useState(isGuest ? 'new-reclamation' : 'list');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  /* Teacher top-level tab */
  const [teacherTab, setTeacherTab] = useState('my-reclamations');

  /* Student category tab */
  const [activeCategory, setActiveCategory] = useState('reclamations');

  const [emailNotify, setEmailNotify] = useState(true);

  /* ─── Reclamation form state ─────────────────────────────── */
  const [recNom, setRecNom] = useState('');
  const [recPrenom, setRecPrenom] = useState('');
  const [recEmail, setRecEmail] = useState('');
  const [recTitle, setRecTitle] = useState('');
  const [recType, setRecType] = useState('');
  const [recDescription, setRecDescription] = useState('');
  const [recFiles, setRecFiles] = useState([]);
  const [recDragActive, setRecDragActive] = useState(false);
  const recFileInputRef = useRef(null);

  /* ─── Justification form state ───────────────────────────── */
  const [jusNom, setJusNom] = useState('');
  const [jusPrenom, setJusPrenom] = useState('');
  const [jusEmail, setJusEmail] = useState('');
  const [jusTitle, setJusTitle] = useState('');
  const [jusType, setJusType] = useState('');
  const [jusDateAbsence, setJusDateAbsence] = useState('');
  const [jusDescription, setJusDescription] = useState('');
  const [jusFiles, setJusFiles] = useState([]);
  const [jusDragActive, setJusDragActive] = useState(false);
  const jusFileInputRef = useRef(null);

  const [reclamationTypes, setReclamationTypes] = useState([]);
  const [justificationTypes, setJustificationTypes] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);

  /* ─── Data from API ──────────────────────────────────────── */
  const [reclamations, setReclamations] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!isGuest && hasStudentRole) {
          const [rRes, jRes] = await Promise.allSettled([
            request('/api/v1/requests/reclamations'),
            request('/api/v1/requests/justifications'),
          ]);

          const unauthorizedFromLists =
            (rRes.status === 'rejected' && rRes.reason?.status === 401) ||
            (jRes.status === 'rejected' && jRes.reason?.status === 401);

          if (unauthorizedFromLists) {
            setAuthRequired(true);
          }

          if (rRes.status === 'fulfilled') {
            const rows = Array.isArray(rRes.value?.data) ? rRes.value.data : [];
            setReclamations(rows.map(normalizeReclamation));
          }
          if (jRes.status === 'fulfilled') {
            const rows = Array.isArray(jRes.value?.data) ? jRes.value.data : [];
            setJustifications(rows.map(normalizeJustification));
          }
        }

        const [rtRes, jtRes] = await Promise.allSettled([
          request('/api/v1/requests/types/reclamations'),
          request('/api/v1/requests/types/justifications'),
        ]);

        if (rtRes.status === 'fulfilled') {
          setReclamationTypes(Array.isArray(rtRes.value?.data) ? rtRes.value.data : []);
        }
        if (jtRes.status === 'fulfilled') {
          setJustificationTypes(Array.isArray(jtRes.value?.data) ? jtRes.value.data : []);
        }

        const unauthorizedFromTypes =
          (rtRes.status === 'rejected' && rtRes.reason?.status === 401) ||
          (jtRes.status === 'rejected' && jtRes.reason?.status === 401);

        if (!isGuest && hasStudentRole && unauthorizedFromTypes) {
          setAuthRequired(true);
        }
      } catch {
        /* endpoints may not exist yet */
      } finally {
        setDataLoading(false);
      }
    })();
  }, [hasStudentRole, isGuest]);

  useEffect(() => {
    if (!canAccessAdminInbox && teacherTab === 'inbox') {
      setTeacherTab('my-reclamations');
    }
  }, [canAccessAdminInbox, teacherTab]);

  useEffect(() => {
    if (!shouldUseProfileIdentity) {
      return;
    }

    setRecNom(user?.nom || '');
    setRecPrenom(user?.prenom || '');
    setRecEmail(user?.email || '');
    setJusNom(user?.nom || '');
    setJusPrenom(user?.prenom || '');
    setJusEmail(user?.email || '');
  }, [shouldUseProfileIdentity, user?.nom, user?.prenom, user?.email]);

  const activeData = activeCategory === 'reclamations' ? reclamations : justifications;

  const filteredData = activeData.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const recStats = {
    total: reclamations.length,
    pending: reclamations.filter((r) => r.status === 'submitted' || r.status === 'under-review').length,
    resolved: reclamations.filter((r) => r.status === 'resolved').length,
    rejected: reclamations.filter((r) => r.status === 'rejected').length,
  };

  const jusStats = {
    total: justifications.length,
    pending: justifications.filter((r) => r.status === 'submitted' || r.status === 'under-review').length,
    resolved: justifications.filter((r) => r.status === 'resolved').length,
    rejected: justifications.filter((r) => r.status === 'rejected').length,
  };

  const stats = activeCategory === 'reclamations' ? recStats : jusStats;

  /* ─── Reset helpers ──────────────────────────────────────── */
  const resetRecForm = () => {
    if (shouldUseProfileIdentity) {
      setRecNom(user?.nom || '');
      setRecPrenom(user?.prenom || '');
      setRecEmail(user?.email || '');
    } else {
      setRecNom('');
      setRecPrenom('');
      setRecEmail('');
    }
    setRecTitle(''); setRecType(''); setRecDescription(''); setRecFiles([]);
  };

  const resetJusForm = () => {
    if (shouldUseProfileIdentity) {
      setJusNom(user?.nom || '');
      setJusPrenom(user?.prenom || '');
      setJusEmail(user?.email || '');
    } else {
      setJusNom('');
      setJusPrenom('');
      setJusEmail('');
    }
    setJusTitle(''); setJusType(''); setJusDateAbsence(''); setJusDescription(''); setJusFiles([]);
  };

  const submitReclamation = async () => {
    if (submitLoading) return;
    try {
      if (!isGuest && authRequired) {
        alert('You must log in first to submit a reclamation.');
        window.location.href = '/login';
        return;
      }

      const useCatalogType = reclamationTypes.length > 0;
      const selectedTypeId = Number(recType);
      if (useCatalogType && (!Number.isInteger(selectedTypeId) || selectedTypeId <= 0)) {
        alert('Please select a valid reclamation type.');
        return;
      }

      setSubmitLoading(true);
      const payload = new FormData();
      if (useCatalogType) {
        payload.append('typeId', String(selectedTypeId));
      } else if (recType?.trim()) {
        payload.append('typeName', recType.trim());
      }
      payload.append('objet', recTitle.trim());
      payload.append('description', recDescription.trim());
      payload.append('priorite', 'normale');
      if (isGuest) {
        payload.append('guestFirstName', recPrenom.trim());
        payload.append('guestLastName', recNom.trim());
        payload.append('guestEmail', recEmail.trim());
      }
      recFiles.forEach((file) => {
        payload.append('files', file);
      });

      const created = await request('/api/v1/requests/reclamations', {
        method: 'POST',
        body: payload,
      });

      if (created?.data) {
        setReclamations((prev) => [normalizeReclamation(created.data), ...prev]);
      }
      resetRecForm();
      setView('list');
      setActiveCategory('reclamations');
    } catch (error) {
      if (!isGuest && error?.status === 401) {
        alert('Session expired or not logged in. Please sign in again.');
        window.location.href = '/login';
        return;
      }
      alert(error?.message || 'Failed to submit reclamation.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const submitJustification = async () => {
    if (submitLoading) return;
    try {
      if (!isGuest && authRequired) {
        alert('You must log in first to submit a justification.');
        window.location.href = '/login';
        return;
      }

      const useCatalogType = justificationTypes.length > 0;
      const selectedTypeId = Number(jusType);
      if (useCatalogType && (!Number.isInteger(selectedTypeId) || selectedTypeId <= 0)) {
        alert('Please select a valid justification type.');
        return;
      }

      setSubmitLoading(true);
      const payload = new FormData();
      if (useCatalogType) {
        payload.append('typeId', String(selectedTypeId));
      } else if (jusType?.trim()) {
        payload.append('typeName', jusType.trim());
      }
      payload.append('dateAbsence', jusDateAbsence);
      const motif = jusDescription.trim() || jusTitle.trim();
      if (motif) {
        payload.append('motif', motif);
        payload.append('description', motif);
      }
      if (isGuest) {
        payload.append('guestFirstName', jusPrenom.trim());
        payload.append('guestLastName', jusNom.trim());
        payload.append('guestEmail', jusEmail.trim());
      }
      jusFiles.forEach((file) => {
        payload.append('files', file);
      });

      const created = await request('/api/v1/requests/justifications', {
        method: 'POST',
        body: payload,
      });

      if (created?.data) {
        setJustifications((prev) => [normalizeJustification(created.data), ...prev]);
      }
      resetJusForm();
      setView('list');
      setActiveCategory('justifications');
    } catch (error) {
      if (!isGuest && error?.status === 401) {
        alert('Session expired or not logged in. Please sign in again.');
        window.location.href = '/login';
        return;
      }
      alert(error?.message || 'Failed to submit justification.');
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ═════════════════════════════════════════════════════════════
     GUEST VIEW — Can submit forms, cannot see history/stats
     ═════════════════════════════════════════════════════════════ */
  if (isGuest) {
    const guestFormType = view === 'new-justification' ? 'justification' : 'reclamation';
    return (
      <div className="space-y-6 min-w-0">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Submit a Request</h1>
          <p className="mt-1 text-sm text-ink-tertiary">
            Submit a reclamation or absence justification. No account required.
          </p>
        </div>

        {authRequired && (
          <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            You are not authenticated. Please sign in to submit or view requests.
          </div>
        )}

        {/* Info banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-edge-strong bg-brand-light px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface">
              <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Want to track your requests?</p>
              <p className="text-xs text-ink-tertiary">Sign in to view submission history and receive status updates.</p>
            </div>
          </div>
        </div>

        {/* Form type toggle */}
        <div className="flex items-center gap-1 p-1 bg-surface-200 rounded-lg w-fit">
          <button
            onClick={() => { setView('new-reclamation'); resetRecForm(); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-2 ${
              guestFormType === 'reclamation'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Reclamation
          </button>
          <button
            onClick={() => { setView('new-justification'); resetJusForm(); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-2 ${
              guestFormType === 'justification'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            Justification
          </button>
        </div>

        {/* The form */}
        <div className="max-w-2xl">
          {guestFormType === 'reclamation' ? renderReclamationForm() : renderJustificationForm()}
        </div>
      </div>
    );
  }

    /* ═════════════════════════════════════════════════════════════
      TEACHER/ADMIN VIEW
      Teacher: My Reclamations workflow.
      Admin: Student Inbox only.
      ═════════════════════════════════════════════════════════════ */
  if (!hasStudentRole && (hasTeacherRole || hasAdminRole)) {
    if (isAdminInboxOnlyView) {
      return <AdminRequestsPage />;
    }

    /* Teacher: detail view */
    if (view === 'detail' && selectedRequest) {
      return (
        <RequestDetailPage
          request={selectedRequest}
          onBack={() => { setView('list'); setSelectedRequest(null); }}
        />
      );
    }

    /* Teacher: new reclamation form */
    if (view === 'new-reclamation') {
      return (
        <div className="space-y-6 max-w-2xl">
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink transition-colors duration-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to My Reclamations
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ink tracking-tight">New Reclamation</h1>
              <CategoryBadge category="reclamation" />
            </div>
            <p className="text-sm text-ink-tertiary mt-1">
              Submit a formal reclamation regarding grades, schedules, or administrative issues.
            </p>
          </div>

          {renderReclamationForm()}
        </div>
      );
    }

    /* Teacher: main view with tabs */
    return (
      <div className="space-y-6 min-w-0">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-surface-200 rounded-lg w-fit">
          <button
            onClick={() => setTeacherTab('my-reclamations')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
              teacherTab === 'my-reclamations'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              My Reclamations
            </span>
          </button>
          {canAccessAdminInbox ? (
            <button
              onClick={() => setTeacherTab('inbox')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                teacherTab === 'inbox'
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
                </svg>
                Student Inbox
              </span>
            </button>
          ) : null}
        </div>

        {/* Tab Content */}
        {teacherTab === 'inbox' && canAccessAdminInbox ? (
          <AdminRequestsPage />
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-xl font-bold text-ink tracking-tight">My Reclamations</h1>
                <p className="mt-1 text-sm text-ink-tertiary">
                  Submit and track your formal reclamations.
                </p>
              </div>
              <button
                onClick={() => { setView('new-reclamation'); resetRecForm(); }}
                className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Reclamation
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total" value={recStats.total} accent="brand"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" /></svg>}
              />
              <StatCard label="Pending" value={recStats.pending} accent="warning"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <StatCard label="Approved" value={recStats.resolved} accent="success"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <StatCard label="Rejected" value={recStats.rejected} accent="danger"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
              />
            </div>

            {/* List */}
            {renderRequestList(reclamations.filter((r) => filterStatus === 'all' || r.status === filterStatus), reclamations)}
          </div>
        )}
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════
     STUDENT VIEWS — Detail / New Form / List
     ═════════════════════════════════════════════════════════════ */

  /* Detail View */
  if (view === 'detail' && selectedRequest) {
    return (
      <RequestDetailPage
        request={selectedRequest}
        onBack={() => { setView('list'); setSelectedRequest(null); }}
      />
    );
  }

  /* New Reclamation Form */
  if (view === 'new-reclamation') {
    return (
      <div className="space-y-6 max-w-2xl">
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink transition-colors duration-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Requests
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ink tracking-tight">New Reclamation</h1>
            <CategoryBadge category="reclamation" />
          </div>
          <p className="text-sm text-ink-tertiary mt-1">
            Submit a formal reclamation regarding grades, schedules, or administrative issues.
          </p>
        </div>

        {renderReclamationForm()}
      </div>
    );
  }

  /* New Justification Form */
  if (view === 'new-justification') {
    return (
      <div className="space-y-6 max-w-2xl">
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink transition-colors duration-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Requests
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ink tracking-tight">New Justification</h1>
            <CategoryBadge category="justification" />
          </div>
          <p className="text-sm text-ink-tertiary mt-1">
            Submit an absence justification with supporting documentation (medical certificate, etc.).
          </p>
        </div>

        {renderJustificationForm()}
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════
     STUDENT — LIST VIEW (default)
     ═════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6 min-w-0">

      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Requests & Appeals</h1>
          <p className="mt-1 text-sm text-ink-tertiary">
            Submit and track your reclamations and absence justifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setView('new-reclamation'); resetRecForm(); }}
            className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Reclamation
          </button>
          <button
            onClick={() => { setView('new-justification'); resetJusForm(); }}
            className="px-4 py-2 text-sm font-medium text-white bg-success rounded-md hover:opacity-90 active:opacity-80 transition-all duration-150 flex items-center gap-2 shadow-soft"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Justification
          </button>
        </div>
      </div>

      {/* ── Category Tabs ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-surface-200 rounded-lg w-fit">
        <button
          onClick={() => { setActiveCategory('reclamations'); setFilterStatus('all'); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-2 ${
            activeCategory === 'reclamations'
              ? 'bg-surface text-ink shadow-sm'
              : 'text-ink-secondary hover:text-ink'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Reclamations
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeCategory === 'reclamations'
              ? 'bg-brand-light text-brand'
              : 'bg-surface-300 text-ink-muted'
          }`}>
            {reclamations.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveCategory('justifications'); setFilterStatus('all'); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-2 ${
            activeCategory === 'justifications'
              ? 'bg-surface text-ink shadow-sm'
              : 'text-ink-secondary hover:text-ink'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
          Justifications
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeCategory === 'justifications'
              ? 'bg-success/10 text-success'
              : 'bg-surface-300 text-ink-muted'
          }`}>
            {justifications.length}
          </span>
        </button>
      </div>

      {/* ── Stats (contextual) ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={activeCategory === 'reclamations' ? 'Total Reclamations' : 'Total Justifications'}
          value={stats.total}
          accent={activeCategory === 'reclamations' ? 'brand' : 'emerald'}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" /></svg>}
        />
        <StatCard
          label="Pending Review"
          value={stats.pending}
          accent="warning"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Approved"
          value={stats.resolved}
          accent="success"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          accent="danger"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
        />
      </div>

      {/* ── Request List ──────────────────────────────────────── */}
      {renderRequestList(filteredData, activeData)}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     ██  SHARED RENDER FUNCTIONS
     ═══════════════════════════════════════════════════════════ */

  /* ── Reclamation Form ───────────────────────────────────── */
  function renderReclamationForm() {
    const identityReady = shouldUseProfileIdentity
      ? Boolean(user?.nom && user?.prenom && user?.email)
      : Boolean(recNom && recPrenom && recEmail);

    return (
      <div className="bg-surface rounded-lg border border-edge shadow-card">
        <div className="px-6 py-4 border-b border-edge-subtle flex items-center gap-2">
          <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h2 className="text-base font-semibold text-ink">Reclamation Details</h2>
        </div>

        <div className="p-6 space-y-5">
          {shouldUseProfileIdentity ? (
            <div className="rounded-md border border-edge bg-surface-200 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-ink-tertiary">Student info</p>
              <p className="mt-1 text-sm font-medium text-ink">{user?.prenom || recPrenom} {user?.nom || recNom}</p>
              <p className="text-xs text-ink-secondary">{user?.email || recEmail}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1.5">
                  Nom <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={recNom}
                  onChange={(e) => setRecNom(e.target.value)}
                  placeholder="Mehdaoui"
                  className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1.5">
                  Prénom <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={recPrenom}
                  onChange={(e) => setRecPrenom(e.target.value)}
                  placeholder="Yacine"
                  className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1.5">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  value={recEmail}
                  onChange={(e) => setRecEmail(e.target.value)}
                  placeholder="y.mehdaoui@univ-tiaret.dz"
                  className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150"
                />
              </div>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Subject <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
              placeholder="e.g., Grade reclamation — Algorithms S1 Final"
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Reclamation Type <span className="text-danger">*</span>
            </label>
            <select
              value={recType}
              onChange={(e) => setRecType(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150"
            >
              {reclamationTypes.length > 0 ? (
                <>
                  <option value="">Select a type…</option>
                  {reclamationTypes.map((t) => (
                    <option key={t.id} value={String(t.id)}>{t.nom || t.nom_en || t.nom_ar || `Type ${t.id}`}</option>
                  ))}
                </>
              ) : (
                RECLAMATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))
              )}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              rows={5}
              value={recDescription}
              onChange={(e) => setRecDescription(e.target.value)}
              placeholder="Provide a detailed explanation of your reclamation, including dates, module names, and any relevant context…"
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150 resize-none"
            />
            <p className="text-xs text-ink-muted mt-1">Be specific. Include dates, module names, and group numbers if applicable.</p>
          </div>

          {/* File Upload */}
          <FileUploadZone
            files={recFiles}
            setFiles={setRecFiles}
            dragActive={recDragActive}
            setDragActive={setRecDragActive}
            fileInputRef={recFileInputRef}
            accentColor="blue"
          />

          {/* Email toggle */}
          <div className="flex items-center justify-between py-2 border-t border-edge-subtle">
            <div>
              <p className="text-sm font-medium text-ink">Email notifications</p>
              <p className="text-xs text-ink-tertiary mt-0.5">Notify me by email when a decision is made.</p>
            </div>
            <button
              role="switch"
              aria-checked={emailNotify}
              onClick={() => setEmailNotify(!emailNotify)}
              className={`shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-150 ${
                emailNotify ? 'bg-brand' : 'bg-surface-300'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-surface shadow-sm transition-transform duration-150 ${
                emailNotify ? 'translate-x-[18px]' : 'translate-x-[3px]'
              }`} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-edge-subtle flex items-center justify-between">
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              Save as Draft
            </button>
            <button
              onClick={submitReclamation}
              disabled={authRequired || submitLoading || !recTitle || !recType || !recDescription || !identityReady}
              className="px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              {submitLoading ? 'Submitting...' : 'Submit Reclamation'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Justification Form ─────────────────────────────────── */
  function renderJustificationForm() {
    const identityReady = shouldUseProfileIdentity
      ? Boolean(user?.nom && user?.prenom && user?.email)
      : Boolean(jusNom && jusPrenom && jusEmail);

    return (
      <div className="bg-surface rounded-lg border border-edge shadow-card">
        <div className="px-6 py-4 border-b border-edge-subtle flex items-center gap-2">
          <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
          <h2 className="text-base font-semibold text-ink">Justification Details</h2>
        </div>

        <div className="p-6 space-y-5">
          {shouldUseProfileIdentity ? (
            <div className="rounded-md border border-edge bg-surface-200 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-ink-tertiary">Student info</p>
              <p className="mt-1 text-sm font-medium text-ink">{user?.prenom || jusPrenom} {user?.nom || jusNom}</p>
              <p className="text-xs text-ink-secondary">{user?.email || jusEmail}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1.5">
                  Nom <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={jusNom}
                  onChange={(e) => setJusNom(e.target.value)}
                  placeholder="Zerhouni"
                  className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1.5">
                  Prénom <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={jusPrenom}
                  onChange={(e) => setJusPrenom(e.target.value)}
                  placeholder="Fatima"
                  className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1.5">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  value={jusEmail}
                  onChange={(e) => setJusEmail(e.target.value)}
                  placeholder="f.zerhouni@univ-tiaret.dz"
                  className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150"
                />
              </div>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Subject <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={jusTitle}
              onChange={(e) => setJusTitle(e.target.value)}
              placeholder="e.g., Absence justification — Medical emergency 17–19 Feb"
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Justification Type <span className="text-danger">*</span>
            </label>
            <select
              value={jusType}
              onChange={(e) => setJusType(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150"
            >
              {justificationTypes.length > 0 ? (
                <>
                  <option value="">Select a type…</option>
                  {justificationTypes.map((t) => (
                    <option key={t.id} value={String(t.id)}>{t.nom || t.nom_en || t.nom_ar || `Type ${t.id}`}</option>
                  ))}
                </>
              ) : (
                JUSTIFICATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Absence Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={jusDateAbsence}
              onChange={(e) => setJusDateAbsence(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              rows={5}
              value={jusDescription}
              onChange={(e) => setJusDescription(e.target.value)}
              placeholder="Explain the reason for your absence, including exact dates and any medical or administrative circumstances…"
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150 resize-none"
            />
            <p className="text-xs text-ink-muted mt-1">Include the exact dates of absence and the reason.</p>
          </div>

          {/* File Upload */}
          <FileUploadZone
            files={jusFiles}
            setFiles={setJusFiles}
            dragActive={jusDragActive}
            setDragActive={setJusDragActive}
            fileInputRef={jusFileInputRef}
            accentColor="emerald"
          />

          {/* Email toggle */}
          <div className="flex items-center justify-between py-2 border-t border-edge-subtle">
            <div>
              <p className="text-sm font-medium text-ink">Email notifications</p>
              <p className="text-xs text-ink-tertiary mt-0.5">Notify me by email when a decision is made.</p>
            </div>
            <button
              role="switch"
              aria-checked={emailNotify}
              onClick={() => setEmailNotify(!emailNotify)}
              className={`shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-150 ${
                emailNotify ? 'bg-success' : 'bg-surface-300'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-surface shadow-sm transition-transform duration-150 ${
                emailNotify ? 'translate-x-[18px]' : 'translate-x-[3px]'
              }`} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-edge-subtle flex items-center justify-between">
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              Save as Draft
            </button>
            <button
              onClick={submitJustification}
              disabled={authRequired || submitLoading || !jusTitle || !jusType || !jusDescription || !identityReady || !jusDateAbsence}
              className="px-4 py-2.5 text-sm font-medium text-white bg-success rounded-md hover:opacity-90 active:opacity-80 transition-all duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              {submitLoading ? 'Submitting...' : 'Submit Justification'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Request List (shared between student & teacher) ────── */
  function renderRequestList(data, allData) {
    return (
      <div className="bg-surface rounded-lg border border-edge shadow-card">
        {/* Filter bar */}
        <div className="px-6 py-4 border-b border-edge-subtle flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'submitted', label: 'Submitted' },
              { key: 'under-review', label: 'Under Review' },
              { key: 'resolved', label: 'Resolved' },
              { key: 'rejected', label: 'Rejected' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-100 ${
                  filterStatus === f.key
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-ink-secondary bg-surface-200 hover:bg-surface-300 hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <ul className="divide-y divide-edge-subtle">
          {data.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <svg className="w-10 h-10 text-ink-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
              </svg>
              <p className="text-sm font-medium text-ink-secondary">No requests found</p>
              <p className="text-xs text-ink-muted mt-1">Try adjusting your filters or submit a new request.</p>
            </li>
          ) : (
            data.map((req) => (
              <li
                key={req.id}
                onClick={() => { setSelectedRequest(req); setView('detail'); }}
                className="px-6 py-4 hover:bg-surface-200/50 transition-colors duration-100 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-ink-muted">{req.id}</span>
                      <CategoryBadge category={req.category} />
                      <StatusBadge status={req.status} />
                    </div>
                    <h3 className="text-sm font-semibold text-ink mt-1">{req.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-ink-tertiary">{req.type}</span>
                      <span className="text-xs text-ink-muted">·</span>
                      <span className="text-xs text-ink-muted">{req.nom} {req.prenom}</span>
                      <span className="text-xs text-ink-muted">·</span>
                      <span className="text-xs text-ink-muted">{formatDate(req.dateSubmitted)}</span>
                    </div>

                    {/* Deadline warning */}
                    {req.linkedExam && req.status !== 'resolved' && req.status !== 'rejected' && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-xs">
                        <svg className="w-3.5 h-3.5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-warning">
                          {daysUntil(req.linkedExam.deadline)} days left to appeal
                        </span>
                        <span className="text-warning">— {req.linkedExam.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Status tracker */}
                  <div className="hidden sm:block shrink-0">
                    <StatusTracker status={req.status} />
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-edge-subtle flex items-center justify-between">
          <p className="text-xs text-ink-muted">
            Showing {data.length} of {allData.length} requests
          </p>
        </div>
      </div>
    );
  }
}

