import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EXPECTED_HEADERS = {
  student: ['matricule', 'nom', 'prenom', 'email', 'telephone'],
  teacher: ['nom', 'prenom', 'email', 'telephone']
};
const CSV_INJECTION_PREFIXES = ['=', '+', '-', '@', '\t'];
const MIN_PHONE_DIGITS = 6;
const MAX_PHONE_DIGITS = 20;

const TEMPLATE_BY_TYPE = {
  student: [
    'matricule,nom,prenom,email,telephone',
    '2025001,Doe,John,john@univ.dz,0555123456',
    '2025002,Smith,Sara,sara@univ.dz,0666234567',
  ].join('\n'),
  teacher: [
    'nom,prenom,email,telephone',
    'Ahmed,Karim,karim@univ.dz,0777345678',
    'Lina,Benali,lina@univ.dz,0555456789',
  ].join('\n'),
};

const TYPE_META = {
  student: {
    title: 'Import Students',
    subtitle: 'Create student accounts with the STUDENT role and secure default passwords.',
    badge: 'STUDENT',
    routeBack: '/dashboard/admin/users',
  },
  teacher: {
    title: 'Import Teachers',
    subtitle: 'Create teacher accounts with the TEACHER role and secure default passwords.',
    badge: 'TEACHER',
    routeBack: '/dashboard/admin/users',
  },
};

function hasAdminAccess(roles) {
  if (!Array.isArray(roles)) return false;
  return roles.some((role) => String(role || '').toLowerCase() === 'admin');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatFrDate(value) {
  return new Date(value).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const detectSeparator = (line) => {
  const commaCount = (line.match(/,/g) || []).length;
  const semiCount = (line.match(/;/g) || []).length;
  return semiCount > commaCount ? ';' : ',';
};

const parseCsv = (text, separator) => {
  const rows = [];
  let current = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === separator) {
      current.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      current.push(cell);
      rows.push(current);
      current = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || current.length > 0) {
    current.push(cell);
    rows.push(current);
  }

  return rows.filter((row) => row.some((value) => String(value).trim() !== ''));
};

const normalizeHeader = (value) => String(value || '').trim().toLowerCase().replace(/^\uFEFF/, '');
const normalizeCell = (value) => String(value ?? '').trim();
const normalizeEmail = (value) => normalizeCell(value).toLowerCase();

const emailLooksValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const stripPhoneToDigits = (value) => value.replace(/\D/g, '');

const phoneLooksValid = (phone) => {
  const trimmed = normalizeCell(phone);
  if (!trimmed) return false;
  if (!/^[+()\d\s.-]+$/.test(trimmed)) return false;
  const digits = stripPhoneToDigits(trimmed);
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
};

const isCsvInjection = (value, allowLeadingPlus) => {
  const trimmed = normalizeCell(value);
  if (!trimmed) return false;
  if (allowLeadingPlus && trimmed.startsWith('+')) {
    return CSV_INJECTION_PREFIXES.some((prefix) => prefix !== '+' && trimmed.startsWith(prefix));
  }
  return CSV_INJECTION_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
};

const analyzeCsv = (text, type) => {
  const normalized = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) {
    return { error: 'CSV file is empty.', rows: [], totals: null };
  }

  const firstLine = normalized.split('\n')[0] || '';
  const separator = detectSeparator(firstLine);
  const rows = parseCsv(normalized, separator);

  if (rows.length < 2) {
    return { error: 'CSV must include a header row and at least one data row.', rows: [], totals: null };
  }

  const expectedHeaders = EXPECTED_HEADERS[type] || EXPECTED_HEADERS.student;
  const header = rows[0].map(normalizeHeader);
  if (header.length !== expectedHeaders.length) {
    return { error: `CSV header must be exactly: ${expectedHeaders.join(',')}`, rows: [], totals: null };
  }

  for (let i = 0; i < expectedHeaders.length; i += 1) {
    if (header[i] !== expectedHeaders[i]) {
      return { error: `CSV header must be exactly: ${expectedHeaders.join(',')}`, rows: [], totals: null };
    }
  }

  const seenEmails = new Set();
  const seenMatricules = new Set();

  const parsedRows = rows.slice(1).map((cells, index) => {
    const safeCells = [...cells];
    while (safeCells.length < expectedHeaders.length) safeCells.push('');

    let matricule = '';
    let nom, prenom, email, telephone;

    if (type === 'student') {
      matricule = normalizeCell(safeCells[0]);
      nom = normalizeCell(safeCells[1]);
      prenom = normalizeCell(safeCells[2]);
      email = normalizeCell(safeCells[3]);
      telephone = normalizeCell(safeCells[4]);
    } else {
      nom = normalizeCell(safeCells[0]);
      prenom = normalizeCell(safeCells[1]);
      email = normalizeCell(safeCells[2]);
      telephone = normalizeCell(safeCells[3]);
    }
    
    const rowNumber = index + 2;

    const errors = [];
    const duplicates = [];

    if (type === 'student' && !matricule) errors.push('Missing matricule');
    if (!nom) errors.push('Missing nom');
    if (!prenom) errors.push('Missing prenom');
    if (!email) errors.push('Missing email');
    if (!telephone) errors.push('Missing telephone');

    const emailKey = normalizeEmail(email);
    if (email && !emailLooksValid(emailKey)) errors.push(`Invalid email format: ${email}`);
    if (telephone && !phoneLooksValid(telephone)) errors.push(`Invalid telephone format: ${telephone}`);

    if (type === 'student' && isCsvInjection(matricule, false)) errors.push(`Unsafe value in matricule: ${matricule}`);
    if (isCsvInjection(nom, false)) errors.push(`Unsafe value in nom: ${nom}`);
    if (isCsvInjection(prenom, false)) errors.push(`Unsafe value in prenom: ${prenom}`);
    if (isCsvInjection(email, false)) errors.push(`Unsafe value in email: ${email}`);
    if (isCsvInjection(telephone, true)) errors.push(`Unsafe value in telephone: ${telephone}`);

    if (emailKey) {
      if (seenEmails.has(emailKey)) duplicates.push(`Duplicate email in CSV: ${email}`);
      else seenEmails.add(emailKey);
    }

    if (type === 'student' && matricule) {
      const matriculeKey = matricule.toLowerCase();
      if (seenMatricules.has(matriculeKey)) duplicates.push(`Duplicate matricule in CSV: ${matricule}`);
      else seenMatricules.add(matriculeKey);
    }

    let status = 'valid';
    let message = '';
    if (errors.length > 0) {
      status = 'invalid';
      message = errors[0];
    } else if (duplicates.length > 0) {
      status = 'duplicate';
      message = duplicates[0];
    }

    return {
      rowNumber,
      matricule,
      nom,
      prenom,
      email,
      telephone,
      status,
      message,
    };
  });

  const totals = parsedRows.reduce(
    (acc, row) => {
      acc.received += 1;
      if (row.status === 'valid') acc.valid += 1;
      if (row.status === 'invalid') acc.invalid += 1;
      if (row.status === 'duplicate') acc.duplicates += 1;
      return acc;
    },
    { received: 0, valid: 0, invalid: 0, duplicates: 0 }
  );

  return { error: '', rows: parsedRows, totals };
};

const statusStyles = {
  valid: 'bg-success/10 text-success border-success/30',
  duplicate: 'bg-warning/10 text-warning border-warning/30',
  invalid: 'bg-danger/10 text-danger border-danger/30',
  created: 'bg-brand/10 text-brand border-brand/30',
  error: 'bg-danger/10 text-danger border-danger/30',
};

const statusLabel = {
  valid: 'Valid',
  duplicate: 'Duplicate',
  invalid: 'Invalid',
  created: 'Created',
  error: 'Error',
};

export default function AdminUserImportPage({ type }) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const canAccess = hasAdminAccess(user?.roles);
  const meta = TYPE_META[type] || TYPE_META.student;

  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewTotals, setPreviewTotals] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [logoBase64, setLogoBase64] = useState('');

  // Load logo from multiple possible locations
  useEffect(() => {
    const loadLogo = async () => {
      const logoPaths = [
        '/Logo.png',
        '/favicon.svg',
        '/web-app-manifest-192x192.png',
        '/web-app-manifest-512x512.png',
        '/favicon.ico'
      ];

      for (const path of logoPaths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              setLogoBase64(reader.result);
            };
            reader.readAsDataURL(blob);
            break;
          }
        } catch (error) {
          console.log(`Logo not found at ${path}`);
        }
      }
    };
    
    loadLogo();
  }, []);

  const exportCreatedCredentials = async (createdRows) => {
    try {
      const today = new Date();
      const dateLabel = today.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const renderedRows = createdRows
        .map((row, index) => {
          const fullName = `${row.prenom || ''} ${row.nom || ''}`.trim();
          return `
            <tr>
              <td style="border: 1px solid #000000; padding: 8px; text-align: center;">${index + 1}</td>
              <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(fullName)}</td>
              <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(row.email)}</td>
              <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(row.telephone || '-')}</td>
              <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(row.tempPassword)}</td>
            </tr>
          `;
        })
        .join('');

      const logoHtml = logoBase64 
        ? `<div style="text-align: center; margin: 20px 0;">
            <img src="${logoBase64}" style="max-width: 120px; max-height: 120px; width: auto; height: auto;" />
           </div>`
        : '';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Fiche de Création des Utilisateurs</title>
            <style>
              @media print {
                body {
                  margin: 0;
                  padding: 20px;
                }
                .page-break {
                  page-break-before: always;
                }
                table {
                  page-break-inside: avoid;
                }
                tr {
                  page-break-inside: avoid;
                  page-break-after: auto;
                }
              }
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Arial', 'Calibri', sans-serif;
                margin: 0;
                padding: 20px;
                color: #000000;
                background: white;
              }
              
              .document-container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
              }
              
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px;
              }
              
              .logo-container {
                text-align: center;
                margin: 20px 0;
              }
              
              .logo-img {
                max-width: 120px;
                max-height: 120px;
                width: auto;
                height: auto;
                display: inline-block;
              }
              
              .arabic-text {
                font-family: 'Traditional Arabic', 'Arial', sans-serif;
                font-size: 16px;
                margin: 10px 0;
              }
              
              .title {
                font-size: 20px;
                font-weight: bold;
                margin: 20px 0 10px 0;
                text-align: center;
              }
              
              .rule {
                border-top: 2px solid #000000;
                margin: 15px 0;
              }
              
              .subtitle {
                font-size: 16px;
                font-weight: bold;
                margin: 10px 0;
              }
              
              .date-info {
                text-align: right;
                margin: 20px 0;
                font-size: 12px;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 11px;
              }
              
              th {
                border: 1px solid #000000;
                padding: 10px 8px;
                background-color: #e8e8e8;
                font-weight: bold;
                text-align: center;
                font-size: 12px;
              }
              
              td {
                border: 1px solid #000000;
                padding: 8px;
                vertical-align: top;
              }
              
              .footer {
                margin-top: 50px;
                padding-top: 30px;
              }
              
              .signatures-table {
                width: 100%;
                margin-top: 30px;
                border: none;
              }
              
              .signatures-table td {
                border: none;
                padding-top: 40px;
                text-align: center;
                vertical-align: bottom;
              }
              
              .signature-line {
                border-top: 1px solid #000000;
                width: 200px;
                margin-top: 10px;
                padding-top: 5px;
              }
              
              .stamp {
                text-align: center;
                margin-top: 30px;
                font-style: italic;
              }
              
              @media print {
                body {
                  margin: 0;
                  padding: 0.5cm;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="document-container">
              <div class="header">
                <div class="arabic-text">
                  <strong>الجمهورية الجزائرية الديمقراطية الشعبية</strong><br/>
                  <strong>وزارة التعليم العالي و البحث العلمي</strong>
                </div>
                
                ${logoHtml}
                
                <div style="margin: 20px 0;">
                  <strong>Université Ibn Khaldoun - Tiaret</strong><br/>
                  Faculté des Mathématiques et Informatique<br/>
                  Département Informatique
                </div>
                
                <div class="rule"></div>
                
                <div class="title">
                  FICHE DE CRÉATION DES UTILISATEURS
                </div>
                
                <div class="rule"></div>
                
                <div class="date-info">
                  Date : ${escapeHtml(dateLabel)}
                </div>
              </div>
              
              <table cellspacing="0" cellpadding="0">
                <thead>
                  <tr>
                    <th style="width: 10%;">N°</th>
                    <th style="width: 25%;">Nom et Prénom</th>
                    <th style="width: 30%;">Email</th>
                    <th style="width: 15%;">Téléphone</th>
                    <th style="width: 20%;">Mot de passe</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderedRows || '<tr><td colspan="5" style="text-align: center;">Aucune donnée</td></tr>'}
                </tbody>
              </table>
              
              <div class="footer">
                <table class="signatures-table">
                  <tr>
                    <td style="width: 50%; text-align: center;">
                      Signature de l'Utilisateur<br/>
                      <div class="signature-line"></div>
                    </td>
                    <td style="width: 50%; text-align: center;">
                      Signature de l'Administration<br/>
                      <div class="signature-line"></div>
                    </td>
                  </tr>
                </table>
                
                <div class="stamp">
                  Cachet officiel de l'établissement
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([html], { 
        type: 'application/vnd.ms-excel;charset=utf-8;' 
      });
      
      const fileName = `fiche_utilisateurs_import_${today.toISOString().slice(0, 10)}.xls`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Also offer PDF print option
      setTimeout(() => {
        if (window.confirm('Do you want to open print dialog to save as PDF?')) {
          const printWindow = window.open('', '_blank');
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      }, 500);
      
    } catch (err) {
      console.error('Export error:', err);
      throw err;
    }
  };

  const issues = useMemo(
    () => previewRows.filter((row) => row.status === 'invalid' || row.status === 'duplicate'),
    [previewRows]
  );

  const canImport = useMemo(
    () => previewRows.length > 0 && previewRows.every((row) => row.status === 'valid'),
    [previewRows]
  );

  const effectiveTotals = importResult?.totals || previewTotals;

  const handleFile = async (file) => {
    if (!file) return;
    const name = String(file.name || '').toLowerCase();
    if (!name.endsWith('.csv')) {
      setError('Please upload a .csv file.');
      return;
    }

    setError('');
    setMessage('');
    setImportResult(null);
    setSelectedFile(file);

    try {
      const text = await file.text();
      const analysis = analyzeCsv(text, type);
      setPreviewRows(analysis.rows);
      setPreviewTotals(analysis.totals);
      setPreviewError(analysis.error || '');
    } catch (err) {
      setPreviewRows([]);
      setPreviewTotals(null);
      setPreviewError('Failed to read the selected file.');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleDownloadTemplate = () => {
    const csv = TEMPLATE_BY_TYPE[type] || TEMPLATE_BY_TYPE.student;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-import-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Select a CSV file first.');
      return;
    }
    if (!canImport) {
      setError('Fix validation errors before importing.');
      return;
    }

    setImporting(true);
    setError('');
    setMessage('');

    try {
      const response = type === 'teacher'
        ? await authAPI.adminImportTeachersCsv(selectedFile, { forcePasswordChange })
        : await authAPI.adminImportStudentsCsv(selectedFile, { forcePasswordChange });

      const payload = response?.data || {};
      setImportResult(payload);
      if (Array.isArray(payload.rows)) setPreviewRows(payload.rows);
      if (payload.totals) setPreviewTotals(payload.totals);

      let msg = `Import completed. Created ${payload.totals?.created ?? 0}, duplicates ${payload.totals?.duplicates ?? 0}, invalid ${payload.totals?.invalid ?? 0}.`;

      if (payload.rows && payload.rows.some((r) => r.tempPassword)) {
        const createdRows = payload.rows.filter((r) => r.tempPassword);
        try {
          await exportCreatedCredentials(createdRows);
          msg += ' Credential sheet downloaded and print dialog opened for PDF.';
        } catch (exportErr) {
          console.error('Failed to export:', exportErr);
          msg += ' Warning: credential sheet/PDF export failed.';
        }
      }

      setMessage(msg);
    } catch (err) {
      setError(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="rounded-2xl border border-edge bg-surface p-6 shadow-card">Loading import workflow...</div>
    );
  }

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-edge bg-surface p-6 shadow-card text-danger">
        Restricted area.
      </div>
    );
  }

  return (
    <div className="import-font-sans space-y-6 max-w-7xl min-w-0">
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 shadow-sm import-fade-up">
        <div className="pointer-events-none absolute -right-20 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-20 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-tertiary">Bulk Import</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{meta.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-secondary">{meta.subtitle}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-edge bg-canvas px-3 py-1 text-xs font-semibold text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" />
              Role assigned automatically: {meta.badge}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 rounded-xl border border-edge bg-canvas px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
            >
              <UploadCloud className="h-4 w-4" />
              Upload CSV
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || !canImport}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface shadow-sm transition hover:bg-brand-hover disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {importing ? 'Importing...' : 'Import'}
            </button>
            <button
              type="button"
              onClick={() => navigate(meta.routeBack)}
              className="inline-flex items-center gap-2 rounded-xl border border-edge bg-canvas px-4 py-2 text-sm font-medium text-ink transition hover:border-brand/40 hover:text-brand"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>
        {importing ? (
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-edge-subtle">
            <div className="import-progress-bar h-full w-1/2 rounded-full bg-brand/60" />
          </div>
        ) : null}
      </section>

      {message ? (
        <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success shadow-card">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-edge-strong bg-danger/10 px-4 py-3 text-sm text-danger shadow-card">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-edge bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">Upload CSV</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  Columns must be in the exact order: {EXPECTED_HEADERS[type]?.join(', ')}.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-tertiary">
                <FileText className="h-4 w-4" />
                {selectedFile ? selectedFile.name : 'No file selected'}
              </div>
            </div>

            <div
              className={`mt-4 rounded-2xl border-2 border-dashed p-6 transition ${
                dragActive ? 'border-brand bg-brand/5' : 'border-edge bg-canvas'
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <UploadCloud className="h-8 w-8 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-ink">Drag and drop your CSV file</p>
                  <p className="mt-1 text-xs text-ink-tertiary">Or click Upload CSV to browse from your device.</p>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                handleFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-edge bg-canvas/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-ink-tertiary">Rows</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{effectiveTotals?.received ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-edge bg-canvas/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-ink-tertiary">Valid</p>
                <p className="mt-2 text-2xl font-semibold text-success">{effectiveTotals?.valid ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-edge bg-canvas/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-ink-tertiary">Issues</p>
                <p className="mt-2 text-2xl font-semibold text-danger">
                  {(effectiveTotals?.invalid ?? 0) + (effectiveTotals?.duplicates ?? 0)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-edge bg-canvas/70 p-4">
              <input
                id={`force-change-${type}`}
                type="checkbox"
                checked={forcePasswordChange}
                onChange={(event) => setForcePasswordChange(event.target.checked)}
                className="h-4 w-4 rounded border-edge text-brand focus:ring-brand"
              />
              <label htmlFor={`force-change-${type}`} className="text-sm text-ink">
                Force password change on first login
              </label>
            </div>

            {previewError ? (
              <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {previewError}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-edge bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-ink">Validation Preview</h2>
                <p className="mt-1 text-sm text-ink-secondary">Preview up to 100 rows before importing.</p>
              </div>
              <span className="text-xs text-ink-tertiary">Status badges update after import.</span>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-edge">
              <table className="w-full text-sm">
                <thead className="bg-surface-200/70 text-ink">
                  <tr>
                    {type === 'student' && <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em]">Matricule</th>}
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em]">Nom</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em]">Prenom</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em]">Email</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em]">Telephone</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 100).map((row) => (
                    <tr key={`row-${row.rowNumber}`} className="border-t border-edge-subtle">
                      {type === 'student' && <td className="px-3 py-2 text-ink-secondary import-font-mono">{row.matricule || '-'}</td>}
                      <td className="px-3 py-2 text-ink">{row.nom || '-'}</td>
                      <td className="px-3 py-2 text-ink">{row.prenom || '-'}</td>
                      <td className="px-3 py-2 text-ink-secondary">{row.email || '-'}</td>
                      <td className="px-3 py-2 text-ink-secondary">{row.telephone || '-'}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            statusStyles[row.status] || statusStyles.valid
                          }`}
                        >
                          {statusLabel[row.status] || 'Valid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {previewRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-sm text-ink-tertiary">
                        Upload a CSV file to see the preview.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {issues.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                <p className="font-semibold">Issues to fix</p>
                <ul className="mt-2 space-y-1">
                  {issues.slice(0, 6).map((row) => (
                    <li key={`issue-${row.rowNumber}`}>Row {row.rowNumber}: {row.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {importResult?.rows?.some((row) => row.tempPassword) ? (
              <div className="mt-4 rounded-2xl border border-edge bg-canvas/70 p-4">
                <p className="text-sm font-semibold text-ink">Temporary passwords</p>
                <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-edge bg-surface">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-200/70">
                      <tr>
                        <th className="px-3 py-2 text-left uppercase tracking-[0.18em]">Email</th>
                        <th className="px-3 py-2 text-left uppercase tracking-[0.18em]">Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.rows
                        .filter((row) => row.tempPassword)
                        .map((row) => (
                          <tr key={`pw-${row.rowNumber}`} className="border-t border-edge-subtle">
                            <td className="px-3 py-2 text-ink-secondary">{row.email}</td>
                            <td className="px-3 py-2 import-font-mono text-ink">{row.tempPassword}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-edge bg-surface p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">CSV Guide</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">How to prepare the file</h3>
            <ol className="mt-3 space-y-2 text-sm text-ink-secondary">
              <li>1. Open Excel or Google Sheets.</li>
              <li>2. Create columns in this exact order: {EXPECTED_HEADERS[type]?.join(', ')}.</li>
              <li>3. Fill rows with {type === 'teacher' ? 'teacher' : 'student'} data only.</li>
              <li>4. Save the file as CSV UTF-8.</li>
              <li>5. Upload the file here and review the preview.</li>
            </ol>
            <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              Do not rename columns, change order, or add extra fields.
            </div>
          </section>

          <section className="rounded-3xl border border-edge bg-surface p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Template</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">Starter CSV snippet</h3>
            <pre className="import-font-mono mt-3 rounded-xl border border-edge bg-canvas/70 p-3 text-[11px] text-ink-secondary">
{TEMPLATE_BY_TYPE[type] || TEMPLATE_BY_TYPE.student}
            </pre>
          </section>

          <section className="rounded-3xl border border-edge bg-surface p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Security</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">Import safeguards</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
              <li>Passwords are generated securely and stored with bcrypt.</li>
              <li>Duplicate emails or matricules are blocked.</li>
              <li>Unsafe CSV formulas are rejected.</li>
              <li>Imports run inside a transaction for rollback safety.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
