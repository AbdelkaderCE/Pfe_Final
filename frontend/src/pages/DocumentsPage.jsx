import React, { useEffect, useMemo, useState } from 'react';
import request, { resolveMediaUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import univLogo from '../assets/images/ibnKhaldoun.jpg';

// ─────────────────────────────────────────────────────────────
// PDF generation (html2canvas + jsPDF, loaded on demand from CDN)
// ─────────────────────────────────────────────────────────────
const PDF_LIBS = {
  jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement('script');
    el.src = src;
    el.onload = resolve;
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });

const ensurePdfLibs = async () => {
  if (!window.jspdf) await loadScript(PDF_LIBS.jspdf);
  if (!window.html2canvas) await loadScript(PDF_LIBS.html2canvas);
};

const buildReferenceCode = (requestId, documentName) => {
  const prefix = String(documentName || 'DOC')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'DOC';
  const year = new Date().getFullYear();
  return `${prefix}/${year}/${String(requestId).padStart(4, '0')}`;
};

const buildDocumentBody = (formData, documentName) => {
  const fullName = `${formData.prenom || ''} ${formData.nom || ''}`.trim() || '___________________';
  const grade = formData.grade || '___________________';
  const dept = formData.departement || 'Informatique';
  const year = `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`;
  const observations = formData.observations
    ? `<p style="margin-top:12px;font-style:italic;color:#555;">Observations : ${formData.observations}</p>`
    : '';
  const docLower = String(documentName || '').toLowerCase();

  if (docLower.includes('salaire')) {
    return `
      <p style="margin-bottom:14px;">Le Doyen atteste que :</p>
      <p style="margin-bottom:14px;padding-left:24px;">
        <strong>${fullName}</strong>, de grade <strong>${grade}</strong>, affecté(e) au département <strong>${dept}</strong>,
        perçoit un salaire au titre de l'année universitaire <strong>${year}</strong>.
      </p>
      ${observations}
      <p>Cette attestation est délivrée à l'intéressé(e) à sa demande pour servir et valoir ce que de droit.</p>`;
  }
  if (docLower.includes('scolarit') || docLower.includes('certificat')) {
    return `
      <p style="margin-bottom:14px;">Le Doyen certifie que :</p>
      <p style="margin-bottom:14px;padding-left:24px;">
        <strong>${fullName}</strong>, du département <strong>${dept}</strong>,
        est régulièrement inscrit(e) au titre de l'année universitaire <strong>${year}</strong>.
      </p>
      ${observations}
      <p>Ce certificat est délivré à l'intéressé(e) à sa demande pour servir et valoir ce que de droit.</p>`;
  }
  if (docLower.includes('mission')) {
    return `
      <p style="margin-bottom:14px;">Il est ordonné à :</p>
      <p style="margin-bottom:14px;padding-left:24px;">
        <strong>${fullName}</strong>, <strong>${grade}</strong>, du département <strong>${dept}</strong>,
        d'effectuer une mission officielle au titre de l'année universitaire <strong>${year}</strong>.
      </p>
      ${observations}
      <p>Fait à Tiaret, pour servir et valoir ce que de droit.</p>`;
  }
  return `
    <p style="margin-bottom:14px;">Le Doyen de la Faculté des Mathématiques et de l'Informatique de l'Université Ibn Khaldoun de Tiaret atteste que :</p>
    <p style="margin-bottom:14px;padding-left:24px;">
      <strong>${fullName}</strong>, de grade <strong>${grade}</strong>,
      département <strong>${dept}</strong>,
      est bien enseignant(e) au sein de notre département durant l'année universitaire <strong>${year}</strong>.
    </p>
    ${observations}
    <p>Cette attestation lui est délivrée à sa demande et pour servir et valoir ce que de droit.</p>
    <p style="font-size:10px;color:#666;font-style:italic;margin-top:12px;">* Cette attestation n'est valable que pour l'année universitaire en cours.</p>`;
};

const DOCUMENT_TITLE_FR_MAP = {
  "شهادة عمل": "Certificat de travail",
  "Work Certificate": "Certificat de travail",
  "شهادة تدريس": "Certificat d'affectation d'enseignement",
  "Teaching Assignment Certificate": "Attestation d'affectation d'enseignement",
  "قرار العطلة العلمية": "Decision de conge scientifique",
  "Academic Leave Decision": "Decision de conge scientifique",
  "إفادة المشاركة البيداغوجية": "Attestation de participation pedagogique",
  "Pedagogical Participation Attestation": "Attestation de participation pedagogique",
  "وثيقة إدارية أخرى": "Autre document administratif",
  "Other Administrative Document": "Autre document administratif",
};

const resolveFrenchDocumentTitle = (title) => {
  const normalized = String(title || "").trim();
  return DOCUMENT_TITLE_FR_MAP[normalized] || normalized || "Document officiel";
};

const ARABIC_RANGE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const isArabicText = (text) => ARABIC_RANGE.test(String(text || ''));

const arabicStyle = 'direction:rtl;unicode-bidi:embed;font-family:"Amiri","Noto Sans Arabic",Arial,sans-serif;text-align:right;';

const buildOfficialHTML = ({ title, bodyHTML, requestId, ref, logoUrl, generatedOn }) => {
  const titleIsArabic = isArabicText(title);
  const titleExtraStyle = titleIsArabic ? arabicStyle : '';

  return `
  <div style="font-family:'Segoe UI','Source Sans 3',Arial,sans-serif;color:#1a1a2e;padding:20px 32px;font-size:12px;background:#fff;">
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;border-bottom:2px solid #1a1a2e;padding-bottom:14px;margin-bottom:6px;gap:8px;">
      ${logoUrl ? `<img src="${logoUrl}" crossorigin="anonymous" style="width:72px;height:72px;object-fit:contain;" alt="Logo"/>` : ''}
      <div style="text-align:center;font-size:10.5px;line-height:1.6;color:#222;font-weight:600;">
        République Algérienne Démocratique et Populaire<br/>
        Ministère de l'Enseignement Supérieur et de la Recherche Scientifique<br/>
        Université Ibn Khaldoun — Tiaret<br/>
        Faculté des Mathématiques et de l'Informatique — Département Informatique
      </div>
    </div>
    <hr style="border:none;border-top:1.5px solid #1a1a2e;margin:8px 0;"/>
    ${ref ? `<p style="font-size:10px;color:#555;margin-bottom:18px;">Réf. : <strong>${ref}</strong></p>` : ''}
    <div style="text-align:center;margin:18px 0 6px;">
      <h1 style="font-size:20px;font-weight:700;letter-spacing:.5px;text-decoration:underline;text-underline-offset:4px;${titleExtraStyle}">${title}</h1>
    </div>
    <div style="font-size:12px;line-height:2.1;text-align:justify;margin:0 8px;">${bodyHTML}</div>
    <p style="text-align:right;margin:28px 8px 0;font-size:11px;">Tiaret, le ${generatedOn}</p>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin:32px 8px 0;">
      <div style="text-align:center;width:170px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#444;margin-bottom:4px;">L'intéressé(e)</div>
        <div style="border-top:1.2px solid #1a1a2e;margin-top:48px;padding-top:4px;font-size:9px;color:#888;">Signature</div>
      </div>
      <div style="text-align:center;width:170px;">
        <div style="width:90px;height:90px;border:1.5px dashed #aaa;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;">
          <span style="font-size:8px;color:#aaa;text-align:center;line-height:1.4;">Cachet du<br/>Département</span>
        </div>
      </div>
      <div style="text-align:center;width:170px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#444;margin-bottom:4px;">Le Doyen / Chef de Département</div>
        <div style="border-top:1.2px solid #1a1a2e;margin-top:48px;padding-top:4px;font-size:9px;color:#888;">Signature & Cachet</div>
      </div>
    </div>
    <div style="border-top:1px solid #ccc;margin-top:36px;padding-top:8px;display:flex;justify-content:space-between;font-size:8px;color:#888;font-style:italic;">
      <span>Généré le ${generatedOn}</span>
      ${requestId ? `<span>Réf. demande #${requestId}</span>` : ''}
      <span>Université Ibn Khaldoun — Tiaret</span>
    </div>
  </div>`;
};

const generatePdfBlob = async ({ title, bodyHTML, requestId, ref }) => {
  await ensurePdfLibs();
  // Ensure Arabic fonts loaded (Amiri / Noto Sans Arabic injected via index.html)
  if (document.fonts && typeof document.fonts.ready === 'object') {
    await document.fonts.ready;
  }
  const generatedOn = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;';
  container.innerHTML = buildOfficialHTML({ title, bodyHTML, requestId, ref, logoUrl: univLogo, generatedOn });
  document.body.appendChild(container);
  try {
    const canvas = await window.html2canvas(container, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
};

const openPdfPreview = ({ title, bodyHTML, requestId, ref }) => {
  const win = window.open('', '_blank');
  if (!win) return;
  const generatedOn = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const html = buildOfficialHTML({ title, bodyHTML, requestId, ref, logoUrl: univLogo, generatedOn });
  win.document.write(
    `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>${title}</title>` +
    `<style>body{margin:0}@media print{@page{size:A4;margin:10mm}}</style></head>` +
    `<body>${html}<script>window.onload=()=>setTimeout(()=>window.print(),300);</script></body></html>`
  );
  win.document.close();
};

const FALLBACK_DOCUMENTS = [
  { id: 'doc-1', name: 'Enrollment Certificate', category: 'Administrative', format: 'PDF', size: '180 KB', updatedAt: '2026-03-01' },
  { id: 'doc-2', name: 'Official Transcript', category: 'Academic', format: 'PDF', size: '420 KB', updatedAt: '2026-02-25' },
  { id: 'doc-3', name: 'Project Defense Template', category: 'PFE', format: 'DOCX', size: '96 KB', updatedAt: '2026-02-20' },
  { id: 'doc-4', name: 'Academic Calendar 2025/2026', category: 'Calendar', format: 'PDF', size: '260 KB', updatedAt: '2026-01-18' },
];

// Token-based semantic color mapping
const getCategoryStyle = (category) => {
  const map = {
    enseignement: { bg: 'rgba(29, 78, 216, 0.05)', text: 'var(--color-brand)' },
    administratif: { bg: 'rgba(22, 163, 74, 0.05)', text: 'var(--color-success)' },
    scientifique: { bg: 'var(--color-surface-200)', text: 'var(--color-ink-secondary)' },
    pedagogique: { bg: 'rgba(202, 138, 4, 0.05)', text: 'var(--color-warning)' },
    autre: { bg: 'var(--color-surface-200)', text: 'var(--color-ink-secondary)' },
    Administrative: { bg: 'rgba(29, 78, 216, 0.05)', text: 'var(--color-brand)' },
    Academic: { bg: 'rgba(22, 163, 74, 0.05)', text: 'var(--color-success)' },
    PFE: { bg: 'rgba(202, 138, 4, 0.05)', text: 'var(--color-warning)' },
    Calendar: { bg: 'var(--color-surface-200)', text: 'var(--color-ink-secondary)' },
  };
  return map[category] || map.autre;
};

const getStatusStyle = (status) => {
  const map = {
    en_attente: { bg: 'var(--color-surface-200)', text: 'var(--color-ink-secondary)' },
    en_traitement: { bg: 'rgba(202, 138, 4, 0.05)', text: 'var(--color-warning)' },
    valide: { bg: 'rgba(22, 163, 74, 0.05)', text: 'var(--color-success)' },
    refuse: { bg: 'rgba(220, 38, 38, 0.05)', text: 'var(--color-danger)' },
  };
  return map[status] || map.en_attente;
};

const STATUS_LABELS = {
  en_attente: 'Pending',
  en_traitement: 'Processing',
  valide: 'Approved',
  refuse: 'Rejected',
};

function normalizeRows(payload) {
  return Array.isArray(payload?.data) ? payload.data : [];
}

// Hero Section - Token-driven depth & unified styling
function DocumentsHero({ eyebrow, title, description }) {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        border: '1px solid var(--color-edge)',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-card)',
        padding: '32px 24px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at top right, rgba(22, 163, 74, 0.08), transparent 35%), radial-gradient(circle at bottom left, rgba(29, 78, 216, 0.08), transparent 35%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 10 }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-brand, #1d4ed8)',
            margin: 0,
          }}
        >
          {eyebrow}
        </p>
        <h1
          style={{
            marginTop: '12px',
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--color-ink)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            marginTop: '12px',
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'var(--color-ink-secondary)',
            maxWidth: '56ch',
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>
    </section>
  );
}

const PROF_FIELDS = [
  {
    name: 'prenom',
    label: 'First Name',
    required: true,
    placeholder: 'Ex: Ahmed',
  },
  {
    name: 'nom',
    label: 'Last Name',
    required: true,
    placeholder: 'Ex: Benali',
  },
  {
    name: 'email',
    label: 'Professional Email',
    required: false,
    placeholder: 'teacher@univ-tiaret.dz',
  },
  {
    name: 'grade',
    label: 'Grade',
    required: false,
    placeholder: 'Assistant Professor',
  },
  {
    name: 'departement',
    label: 'Department',
    required: false,
    placeholder: 'Computer Science',
  },
  {
    name: 'observations',
    label: 'Observations',
    required: false,
    multiline: true,
    placeholder: 'Additional notes for the certificate...',
  },
];

function ProfFormModal({ requestId, documentName, onClose, onSubmit, onPreview, onDownload, loading, initialData, fetchingData }) {
  const [form, setForm] = useState(initialData || {});
  const [autoFilled, setAutoFilled] = useState(!!initialData && Object.keys(initialData).length > 0);
  const [showErrors, setShowErrors] = useState(false);

  const docLower = String(documentName || '').toLowerCase();
  let requiredFields = ['prenom', 'nom', 'grade', 'departement'];
  if ((docLower.includes('scolarit') || docLower.includes('certificat')) && !docLower.includes('travail') && !docLower.includes('عمل')) {
    requiredFields = ['prenom', 'nom', 'departement'];
  }

  const isFormValid = () => {
    return requiredFields.every((field) => form[field] && String(form[field]).trim() !== '');
  };

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm(initialData);
      setAutoFilled(true);
    }
  }, [initialData]);

  const handleChange = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const validate = () => {
    setShowErrors(true);
    const missing = requiredFields.filter((f) => !form[f] || String(form[f]).trim() === '');
    if (missing.length) {
      alert(`Please fill all required fields`);
      return false;
    }
    return true;
  };

  const handleSubmit = () => { if (validate()) onSubmit(form); };
  const handlePreview = () => { if (validate() && onPreview) onPreview(form); };
  const handleDownload = () => { if (validate() && onDownload) onDownload(form); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-edge bg-surface shadow-2xl overflow-hidden">
        <div className="relative overflow-hidden px-6 py-5 border-b border-edge bg-surface">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_50%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Administration</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Teacher Information</h2>
              <p className="mt-0.5 text-sm text-ink-secondary">
                {requestId && <span className="font-medium text-ink">Request #{requestId} - </span>}
                {documentName && <span className="font-medium text-ink">{documentName} - </span>}
                The official document will be generated as a PDF and sent to the requester.
              </p>

              {autoFilled && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                  </svg>
                  Pre-filled information from the database - verify before generating.
                </div>
              )}

              {fetchingData && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                  Loading teacher information...
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="mt-1 shrink-0 rounded-xl border border-edge bg-canvas p-2 text-ink-secondary transition hover:bg-surface hover:text-ink"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {fetchingData ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-pulse">
              {PROF_FIELDS.filter((f) => !f.multiline).map((field) => (
                <div key={field.name}>
                  <div className="h-3 w-24 rounded bg-gray-200 mb-2" />
                  <div className="h-10 w-full rounded-xl bg-gray-100" />
                </div>
              ))}
              <div className="sm:col-span-2">
                <div className="h-3 w-32 rounded bg-gray-200 mb-2" />
                <div className="h-20 w-full rounded-xl bg-gray-100" />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PROF_FIELDS.filter((f) => !f.multiline).map((field) => {
                  const isRequired = requiredFields.includes(field.name);
                  const isInvalid = showErrors && isRequired && (!form[field.name] || String(form[field.name]).trim() === '');
                  return (
                    <div key={field.name}>
                      <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                        {field.label}
                        {isRequired && <span className="ml-0.5 text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={form[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-ink-tertiary transition
                          ${isInvalid ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : 
                            (autoFilled && form[field.name]
                            ? 'border-emerald-300 bg-emerald-50/60 focus:border-emerald-400'
                            : 'border-edge bg-canvas focus:border-brand')}
                          `}
                      />
                      {isInvalid && (
                        <p className="mt-1 text-[10px] font-medium text-red-500">This field is required</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {PROF_FIELDS.filter((f) => f.multiline).map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                    {field.label}
                  </label>
                  <textarea
                    rows={3}
                    value={form[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full resize-none rounded-xl border border-edge bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-ink-tertiary"
                  />
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 border-t border-edge bg-canvas">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-50"
          >
            Cancel
          </button>
          {onPreview && (
            <button
              onClick={handlePreview}
              disabled={loading || fetchingData}
              className="rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-50 flex items-center gap-2"
              title="Open a printable preview in a new tab"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Preview
            </button>
          )}
          {onDownload && (
            <button
              onClick={handleDownload}
              disabled={loading || fetchingData}
              className="rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-50 flex items-center gap-2"
              title="Download PDF without sending it"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || fetchingData || (showErrors && !isFormValid())}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
                Generate PDF & Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeacherView() {
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [expandForm, setExpandForm] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [typesRes, docsRes] = await Promise.all([
        request('/api/v1/documents'),
        request('/api/v1/documents/my-requests'),
      ]);
      setDocTypes(normalizeRows(typesRes));
      setDocuments(normalizeRows(docsRes));
    } catch {
      setDocTypes([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateRequest = async () => {
    if (!selectedType) return;
    setRequestLoading(true);
    try {
      await request('/api/v1/documents/request', {
        method: 'POST',
        body: JSON.stringify({ typeDocId: Number(selectedType), description: 'Document request' }),
      });
      setSelectedType('');
      setExpandForm(false);
      await loadAll();
    } catch {
    } finally {
      setRequestLoading(false);
    }
  };

  // KPI Summary for Teacher
  const summary = useMemo(() => ({
    total: documents.length,
    pending: documents.filter((d) => d.status === 'en_attente').length,
    processing: documents.filter((d) => d.status === 'en_traitement').length,
    approved: documents.filter((d) => d.status === 'valide').length,
  }), [documents]);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return documents;
    return documents.filter((doc) =>
      [doc.name, doc.category, doc.status].some((value) => String(value || '').toLowerCase().includes(lower))
    );
  }, [documents, query]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Section */}
      <DocumentsHero
        eyebrow="Teacher Space"
        title="Documents"
        description="Submit a document request, track its status, and download the file once approved."
      />

      {/* KPI Header - Teacher Context */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {[
          { label: 'Total', value: summary.total, accent: 'brand' },
          { label: 'Pending', value: summary.pending, accent: 'warning' },
          { label: 'Processing', value: summary.processing, accent: 'warning' },
          { label: 'Approved', value: summary.approved, accent: 'success' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              borderRadius: '8px',
              border: '1px solid var(--color-edge)',
              background: 'var(--color-surface)',
              boxShadow: 'var(--shadow-card)',
              padding: '16px',
              transition: 'all 150ms ease-out',
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stat.label}
            </p>
            <p style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700, color: `var(--color-${stat.accent})`, margin: 0 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Unified Workspace Surface - Action-Triggered Hero */}
      <section
        style={{
          borderRadius: '8px',
          border: '1px solid var(--color-edge)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: '1px solid var(--color-edge-subtle)',
            background: expandForm ? 'var(--color-surface-200)' : 'var(--color-surface)',
            transition: 'all 150ms ease-out',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>New Request</h2>
            <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', margin: '4px 0 0 0' }}>
              Select a document type and send your request
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpandForm(!expandForm)}
            style={{
              borderRadius: '6px',
              border: 'none',
              background: expandForm ? 'var(--color-surface)' : 'var(--color-brand, #1d4ed8)',
              color: expandForm ? 'var(--color-brand)' : '#fff',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
            }}
          >
            {expandForm ? 'Cancel' : 'New Request'}
          </button>
        </div>

        {/* Expanded Form - Token-driven styling */}
        {expandForm && (
          <div style={{ padding: '24px', borderTop: '1px solid var(--color-edge-subtle)', background: 'var(--color-surface-200)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  borderRadius: '6px',
                  border: '1px solid var(--color-edge)',
                  background: 'var(--color-surface)',
                  padding: '12px',
                  fontSize: '13px',
                  color: 'var(--color-ink)',
                  outline: 'none',
                  transition: 'all 150ms ease-out',
                }}
              >
                <option value="">Choose document type</option>
                {docTypes.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.nom_en || doc.nom_ar || 'Document'} - {doc.categorie}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCreateRequest}
                disabled={requestLoading || !selectedType}
                style={{
                  borderRadius: '6px',
                  border: 'none',
                  background: selectedType ? 'var(--color-brand, #1d4ed8)' : 'var(--color-control-border)',
                  color: '#fff',
                  padding: '12px 24px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: selectedType ? 'pointer' : 'not-allowed',
                  opacity: requestLoading ? 0.6 : 1,
                  transition: 'all 150ms ease-out',
                }}
              >
                {requestLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Requests Table Section - Data-Dense Layout */}
      <section
        style={{
          borderRadius: '8px',
          border: '1px solid var(--color-edge)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with Search */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-edge-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>My Requests</h2>
            <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', margin: '4px 0 0 0' }}>
              Request history and status ({filtered.length})
            </p>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            style={{
              borderRadius: '6px',
              border: '1px solid var(--color-edge)',
              background: 'var(--color-surface-200)',
              padding: '8px 12px',
              fontSize: '13px',
              color: 'var(--color-ink)',
              outline: 'none',
              minWidth: '200px',
              transition: 'all 150ms ease-out',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '12px', color: 'var(--color-ink-secondary)' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--color-edge)', borderTop: '2px solid var(--color-brand)', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '13px' }}>Loading...</span>
            </div>
          ) : filtered.length ? (
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {filtered.map((doc) => {
                const categoryStyle = getCategoryStyle(doc.category);
                const statusStyle = getStatusStyle(doc.status);
                return (
                  <div
                    key={doc.id}
                    style={{
                      borderRadius: '6px',
                      border: '1px solid var(--color-edge)',
                      background: 'var(--color-surface-200)',
                      padding: '16px',
                      transition: 'all 150ms ease-out',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)', margin: 0, flex: 1 }}>{doc.name}</h3>
                      <span style={{
                        borderRadius: '6px',
                        background: categoryStyle.bg,
                        color: categoryStyle.text,
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {doc.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{
                        borderRadius: '6px',
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}>
                        {STATUS_LABELS[doc.status] || doc.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--color-ink-tertiary)', margin: '0 0 12px 0' }}>
                      Updated : {doc.updatedAt || 'N/A'}
                    </p>
                    {doc.status === 'valide' && doc.documentUrl ? (
                      <a
                        href={resolveMediaUrl(`/api/v1/documents/download/${doc.id}`)}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'block',
                          width: '100%',
                          borderRadius: '6px',
                          background: 'var(--color-brand, #1d4ed8)',
                          color: '#fff',
                          padding: '8px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          transition: 'all 150ms ease-out',
                        }}
                      >
                        Download
                      </a>
                    ) : (
                      <div style={{
                        display: 'block',
                        width: '100%',
                        borderRadius: '6px',
                        background: 'var(--color-surface)',
                        color: 'var(--color-ink-tertiary)',
                        padding: '8px 12px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 500,
                        border: '1px solid var(--color-edge-subtle)',
                      }}>
                        {doc.status === 'refuse' ? 'Request rejected' : 'Pending processing'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              borderRadius: '6px',
              border: '1px dashed var(--color-edge)',
              background: 'var(--color-surface-200)',
              padding: '48px 24px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink)', margin: 0 }}>No requests found.</p>
              <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', margin: '8px 0 0 0' }}>Submit your first request above.</p>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AdminView() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [generating, setGenerating] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [profModal, setProfModal] = useState(null);
  const [fetchingProfData, setFetchingProfData] = useState(false);
  const [openingModal, setOpeningModal] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await request('/api/v1/documents/all-requests');
      setRequests(normalizeRows(response));
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const openProfModal = async (requestRow) => {
    setOpeningModal(true);
    setFeedback(null);
    try {
      setFetchingProfData(true);
      const enseignantNom = String(requestRow?.enseignantNom || '').trim();
      const [prenom = '', ...rest] = enseignantNom.split(' ').filter(Boolean);
      const nom = rest.join(' ');
      setProfModal({
        requestId: requestRow?.id,
        documentName: requestRow?.name,
        initialData: { prenom, nom, departement: requestRow?.category || '' },
      });
    } finally {
      setFetchingProfData(false);
      setOpeningModal(false);
    }
  };

  const closeProfModal = () => {
    if (openingModal || generating) return;
    setProfModal(null);
  };

  const makePdfPayload = (formData) => {
    const rawTitle = profModal?.documentName || 'Document officiel';
    const title = resolveFrenchDocumentTitle(rawTitle);
    const ref = buildReferenceCode(profModal?.requestId, profModal?.documentName);
    const bodyHTML = buildDocumentBody(formData, rawTitle);
    return { title, ref, bodyHTML, requestId: profModal?.requestId };
  };

  const handleProfSubmit = async (formData) => {
    if (!profModal?.requestId) return;
    const requestId = profModal.requestId;
    setGenerating(requestId);
    setFeedback(null);
    try {
      const payload = makePdfPayload(formData);
      const blob = await generatePdfBlob(payload);

      const upload = new FormData();
      const safeName = String(payload.title).replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'document';
      upload.append('file', blob, `${safeName}_${requestId}.pdf`);
      upload.append('requestId', String(requestId));
      upload.append('profForm', JSON.stringify(formData));

      await request('/api/v1/documents/upload', { method: 'POST', body: upload });
      await request(`/api/v1/documents/${requestId}/valider`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'valide' }),
      });

      setFeedback({ type: 'success', message: 'Document PDF généré et transmis au demandeur avec succès.' });
      setProfModal(null);
      await loadRequests();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message || "Échec de la génération ou de l'envoi du document.",
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleProfPreview = (formData) => {
    if (!profModal?.requestId) return;
    openPdfPreview(makePdfPayload(formData));
  };

  const handleProfDownload = async (formData) => {
    if (!profModal?.requestId) return;
    setGenerating(profModal.requestId);
    setFeedback(null);
    try {
      const payload = makePdfPayload(formData);
      const blob = await generatePdfBlob(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = String(payload.title).replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'document';
      a.href = url;
      a.download = `${safeName}_${profModal.requestId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Échec du téléchargement du PDF.' });
    } finally {
      setGenerating(null);
    }
  };

  const handleAction = async (requestId, action) => {
    setActionLoading(`${requestId}-${action}`);
    setFeedback(null);

    try {
      await request(`/api/v1/documents/${requestId}/valider`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });

      setFeedback({
        type: 'success',
        message: action === 'valide' ? 'Request approved successfully.' : 'Request rejected successfully.',
      });
      await loadRequests();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message || 'Action unavailable right now.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    let rows = requests;
    if (filterStatus) rows = rows.filter((row) => row.status === filterStatus);
    const lower = query.trim().toLowerCase();
    if (!lower) return rows;
    return rows.filter((row) =>
      [row.enseignantNom, row.name, row.category, row.status].some((value) =>
        String(value || '').toLowerCase().includes(lower)
      )
    );
  }, [requests, query, filterStatus]);

  const counts = useMemo(() => ({
    total: requests.length,
    en_attente: requests.filter((r) => r.status === 'en_attente').length,
    en_traitement: requests.filter((r) => r.status === 'en_traitement').length,
    valide: requests.filter((r) => r.status === 'valide').length,
  }), [requests]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {profModal && (
        <ProfFormModal
          requestId={profModal.requestId}
          documentName={profModal.documentName}
          onClose={closeProfModal}
          onSubmit={handleProfSubmit}
          onPreview={handleProfPreview}
          onDownload={handleProfDownload}
          loading={openingModal || generating === profModal.requestId}
          initialData={profModal.initialData}
          fetchingData={fetchingProfData}
        />
      )}

      {/* Hero Section */}
      <DocumentsHero
        eyebrow="Administration"
        title="Document Management"
        description="Process teacher requests: fill in the information, generate the official PDF and transmit it automatically to the requester."
      />

      {/* KPI Analytics Header - High-impact metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {[
          { label: 'Total', value: counts.total, accent: 'ink', bg: 'rgba(26, 29, 35, 0.05)' },
          { label: 'Pending', value: counts.en_attente, accent: 'warning', bg: 'rgba(202, 138, 4, 0.05)' },
          { label: 'Processing', value: counts.en_traitement, accent: 'warning', bg: 'rgba(202, 138, 4, 0.08)' },
          { label: 'Approved', value: counts.valide, accent: 'success', bg: 'rgba(22, 163, 74, 0.05)' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              borderRadius: '8px',
              border: '1px solid var(--color-edge)',
              background: 'var(--color-surface)',
              boxShadow: 'var(--shadow-card)',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 150ms ease-out',
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-16px',
              right: '-16px',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: stat.bg,
              filter: 'blur(32px)',
              opacity: 0.5,
            }} />
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stat.label}
            </p>
            <p style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700, color: `var(--color-${stat.accent})`, margin: 0 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Unified Management Workspace */}
      <section
        style={{
          borderRadius: '8px',
          border: '1px solid var(--color-edge)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {feedback && (
          <div
            style={{
              margin: '12px 16px 0',
              borderRadius: '6px',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(22, 163, 74, 0.35)' : 'rgba(220, 38, 38, 0.35)'}`,
              background: feedback.type === 'success' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)',
              color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
              padding: '10px 12px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {feedback.message}
          </div>
        )}

        {/* Toolbar - Global Filtering */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--color-edge-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
              All requests
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', margin: '4px 0 0 0' }}>
              {filtered.length} request{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                borderRadius: '6px',
                border: '1px solid var(--color-edge)',
                background: 'var(--color-surface-200)',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--color-ink)',
                outline: 'none',
                transition: 'all 150ms ease-out',
              }}
            >
              <option value="">All statuses</option>
              <option value="en_attente">Pending</option>
              <option value="en_traitement">Processing</option>
              <option value="valide">Approved</option>
              <option value="refuse">Rejected</option>
            </select>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              style={{
                borderRadius: '6px',
                border: '1px solid var(--color-edge)',
                background: 'var(--color-surface-200)',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--color-ink)',
                outline: 'none',
                minWidth: '220px',
                transition: 'all 150ms ease-out',
              }}
            />
          </div>
        </div>

        {/* Data-Dense Table */}
        <div style={{ flex: 1, overflowX: 'auto', position: 'relative' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '12px', color: 'var(--color-ink-secondary)' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--color-edge)', borderTop: '2px solid var(--color-brand)', animation: 'spin 1s linear infinite' }} />
              <span>Loading...</span>
            </div>
          ) : filtered.length ? (
            <table
              style={{
                width: '100%',
                fontSize: '13px',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--color-surface-200)', borderBottom: '1px solid var(--color-edge)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teacher</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => {
                  const categoryStyle = getCategoryStyle(row.category);
                  const statusStyle = getStatusStyle(row.status);
                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: '1px solid var(--color-edge-subtle)',
                        background: idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-200)',
                        transition: 'all 150ms ease-out',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-ink)' }}>{row.enseignantNom || '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-ink-secondary)' }}>{row.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          borderRadius: '6px',
                          background: categoryStyle.bg,
                          color: categoryStyle.text,
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}>
                          {row.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-ink-tertiary)' }}>{row.updatedAt || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          borderRadius: '6px',
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}>
                          {STATUS_LABELS[row.status] || row.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(row.status === 'en_attente' || row.status === 'en_traitement') && (
                            <button
                              type="button"
                              onClick={() => openProfModal(row)}
                              disabled={generating === row.id}
                              title="Generate PDF document"
                              style={{
                                borderRadius: '4px',
                                border: '1px solid var(--color-edge)',
                                background: 'var(--color-surface-200)',
                                color: 'var(--color-ink-secondary)',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: generating === row.id ? 'wait' : 'pointer',
                                opacity: generating === row.id ? 0.6 : 1,
                                transition: 'all 150ms ease-out',
                              }}
                            >
                              {generating === row.id ? '⏳' : '📝'}
                            </button>
                          )}
                          {row.status === 'en_traitement' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAction(row.id, 'valide')}
                                disabled={Boolean(actionLoading)}
                                style={{
                                  borderRadius: '4px',
                                  border: 'none',
                                  background: 'var(--color-success)',
                                  color: '#fff',
                                  padding: '6px 12px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: actionLoading ? 'wait' : 'pointer',
                                  opacity: actionLoading ? 0.6 : 1,
                                  transition: 'all 150ms ease-out',
                                }}
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAction(row.id, 'refuse')}
                                disabled={Boolean(actionLoading)}
                                style={{
                                  borderRadius: '4px',
                                  border: 'none',
                                  background: 'var(--color-danger)',
                                  color: '#fff',
                                  padding: '6px 12px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: actionLoading ? 'wait' : 'pointer',
                                  opacity: actionLoading ? 0.6 : 1,
                                  transition: 'all 150ms ease-out',
                                }}
                              >
                                ✕
                              </button>
                            </>
                          )}
                          {row.status === 'valide' && row.documentUrl && (
                            <a
                              href={resolveMediaUrl(`/api/v1/documents/download/${row.id}`)}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                borderRadius: '4px',
                                border: 'none',
                                background: 'var(--color-brand, #1d4ed8)',
                                color: '#fff',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'none',
                                display: 'inline-block',
                                transition: 'all 150ms ease-out',
                              }}
                            >
                              ⬇️
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{
              borderRadius: '6px',
              border: '1px dashed var(--color-edge)',
              background: 'var(--color-surface-200)',
              padding: '64px 24px',
              textAlign: 'center',
              margin: '16px',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink)', margin: 0 }}>No requests found.</p>
              <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', margin: '8px 0 0 0' }}>Adjust filters or wait for new requests.</p>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function StudentView() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await request('/api/v1/documents/student-documents');
      setDocuments(normalizeRows(response));
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return documents;
    return documents.filter((doc) => [doc.name, doc.category].some((value) => String(value || '').toLowerCase().includes(lower)));
  }, [documents, query]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Section */}
      <DocumentsHero
        eyebrow="Ressources"
        title="Mes documents"
        description="Accédez aux documents fournis par vos enseignants ou l'administration."
      />

      {/* Unified Resource Workspace */}
      <section
        style={{
          borderRadius: '8px',
          border: '1px solid var(--color-edge)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar - Search */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--color-edge-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
              Tous les documents
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', margin: '4px 0 0 0' }}>
              {filtered.length} document{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            style={{
              borderRadius: '6px',
              border: '1px solid var(--color-edge)',
              background: 'var(--color-surface-200)',
              padding: '8px 12px',
              fontSize: '13px',
              color: 'var(--color-ink)',
              outline: 'none',
              minWidth: '220px',
              transition: 'all 150ms ease-out',
            }}
          />
        </div>

        {/* Data-Dense Card Grid */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px', color: 'var(--color-ink-secondary)' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--color-edge)', borderTop: '2px solid var(--color-brand)', animation: 'spin 1s linear infinite' }} />
              <span>Chargement...</span>
            </div>
          ) : filtered.length ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {filtered.map((doc) => {
                const categoryStyle = getCategoryStyle(doc.category);
                return (
                  <a
                    key={doc.id}
                    href={resolveMediaUrl(`/api/v1/documents/download/${doc.id}`)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      borderRadius: '8px',
                      border: '1px solid var(--color-edge)',
                      background: 'var(--color-surface-200)',
                      boxShadow: 'var(--shadow-card)',
                      padding: '20px',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'all 150ms ease-out',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-brand)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(29, 78, 216, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-edge)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink)', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {doc.name}
                      </p>
                      <span style={{ fontSize: '18px', opacity: 0, transition: 'opacity 150ms ease-out', marginLeft: 'auto' }} data-icon="⬇️">⬇️</span>
                    </div>
                    <span style={{
                      display: 'inline-block',
                      borderRadius: '6px',
                      background: categoryStyle.bg,
                      color: categoryStyle.text,
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      width: 'fit-content',
                    }}>
                      {doc.category}
                    </span>
                    <p style={{ fontSize: '11px', color: 'var(--color-ink-tertiary)', margin: 0, marginTop: 'auto' }}>
                      {doc.updatedAt || '—'}
                    </p>
                  </a>
                );
              })}
            </div>
          ) : (
            <div style={{
              borderRadius: '8px',
              border: '1px dashed var(--color-edge)',
              background: 'var(--color-surface)',
              padding: '80px 24px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-ink)', margin: 0 }}>Aucun document trouvé.</p>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', margin: '8px 0 0 0' }}>Vos enseignants publieront prochainement des documents.</p>
            </div>
          )}
        </div>
      </section>

      <style>{`
        a[href] div > span[data-icon] { opacity: 0; }
        a[href]:hover div > span[data-icon] { opacity: 1; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles.map((role) => String(role || '').toLowerCase()) : [];

  const isAdmin = roles.includes('admin');
  const isTeacher = roles.includes('enseignant') || roles.includes('teacher');
  const isStudent = roles.includes('etudiant');

  if (isAdmin) {
    return <AdminView />;
  }

  if (isTeacher) {
    return <TeacherView />;
  }

  if (isStudent) {
    return <StudentView />;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <DocumentsHero
        eyebrow="Documents"
        title="Accès limité"
        description="Votre rôle ne dispose pas d'une vue documents dédiée dans ce module."
      />
      <section style={{
        borderRadius: '8px',
        border: '1px solid var(--color-edge)',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-card)',
        padding: '24px',
      }}>
        <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', margin: 0 }}>Contactez l'administration pour demander l'activation d'accès appropriés.</p>
      </section>
    </div>
  );
}

