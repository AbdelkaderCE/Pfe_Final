import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function hasAdminAccess(roles) {
  if (!Array.isArray(roles)) return false;
  return roles
    .map((role) => String(role || '').toLowerCase())
    .some((role) => role === 'admin');
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'enseignant', label: 'Teacher' },
  { value: 'etudiant', label: 'Student' },
];

function roleLabel(roleName) {
  if (roleName === 'admin') return 'Admin';
  if (roleName === 'enseignant') return 'Teacher';
  if (roleName === 'etudiant') return 'Student';
  return roleName;
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

const emptyRow = () => ({
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  roleNames: [],
});

export default function AdminUsersListPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const canAccess = hasAdminAccess(user?.roles);

  const [rows, setRows] = useState([emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const excelInputRef = useRef(null);

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
          const roleText = (row.roleNames || []).map(roleLabel).join(', ');
          return `
            <tr>
              <td style="border: 1px solid #000000; padding: 8px; text-align: center;">${index + 1}</td>
              <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(fullName)}</td>
              <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(row.email)}</td>
              <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(row.telephone || '-')}</td>
              <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(roleText || '-')}</td>
              <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(row.tempPassword)}</td>
              <td style="border: 1px solid #000000; padding: 8px; text-align: center;">${escapeHtml(formatFrDate(row.generatedAt))}</td>
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
                    <th style="width: 5%;">N°</th>
                    <th style="width: 20%;">Nom et Prénom</th>
                    <th style="width: 25%;">Email</th>
                    <th style="width: 10%;">Téléphone</th>
                    <th style="width: 15%;">Rôle</th>
                    <th style="width: 15%;">Mot de passe</th>
                    <th style="width: 10%;">Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderedRows || '<tr><td colspan="7" style="text-align: center;">Aucune donnée</td></tr>'}
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
      
      const fileName = `fiche_utilisateurs_${today.toISOString().slice(0, 10)}.xls`;
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

  const updateRow = (index, key, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const toggleRole = (index, roleName) => {
    setRows((prev) => prev.map((row, i) => {
      if (i !== index) return row;
      const current = row.roleNames || [];
      const next = current.includes(roleName)
        ? current.filter((name) => name !== roleName)
        : [...current, roleName];
      return { ...row, roleNames: next };
    }));
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== index));
  };

  const validateRow = (row, rowIndex) => {
    if (!row.nom.trim() || !row.prenom.trim() || !row.email.trim()) {
      return `Row ${rowIndex + 1}: nom, prenom, and email are required.`;
    }

    if (!row.roleNames.length) {
      return `Row ${rowIndex + 1}: select at least one role.`;
    }

    const hasStudent = row.roleNames.includes('etudiant');
    const hasStaff = row.roleNames.some((r) => ['admin', 'enseignant'].includes(r));
    if (hasStudent && hasStaff) {
      return `Row ${rowIndex + 1}: student role cannot be mixed with teacher/admin roles.`;
    }

    return null;
  };

  const submitList = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const activeRows = rows.filter((row) => row.nom.trim() || row.prenom.trim() || row.email.trim());
    if (!activeRows.length) {
      setError('Please fill at least one row.');
      return;
    }

    for (let i = 0; i < activeRows.length; i += 1) {
      const validationError = validateRow(activeRows[i], i);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setLoading(true);
    try {
      let created = 0;
      const failures = [];
      const createdRows = [];

      for (const row of activeRows) {
        try {
          const response = await authAPI.adminCreateUser({
            nom: row.nom.trim(),
            prenom: row.prenom.trim(),
            email: row.email.trim(),
            telephone: row.telephone.trim() || undefined,
            roleNames: row.roleNames,
          });

          const tempPassword = response?.data?.tempPassword;
          if (!tempPassword) {
            throw new Error('Temporary password not returned');
          }

          createdRows.push({
            nom: row.nom.trim(),
            prenom: row.prenom.trim(),
            email: row.email.trim(),
            telephone: row.telephone.trim(),
            roleNames: row.roleNames,
            tempPassword,
            generatedAt: new Date().toISOString(),
          });

          created += 1;
        } catch (err) {
          failures.push(`${row.email.trim()}: ${err?.message || 'failed'}`);
        }
      }

      if (createdRows.length > 0) {
        try {
          await exportCreatedCredentials(createdRows);
          setMessage(`List created successfully. ${created} user(s) created. The Excel file has been downloaded and print dialog opened for PDF.`);
        } catch (exportErr) {
          console.error('Failed to export:', exportErr);
          setError((prev) => `${prev} Warning: Excel/PDF export failed, but ${created} user(s) were created successfully.`);
        }
      }

      if (failures.length) {
        setError(`Created ${created}. Failed ${failures.length}: ${failures.slice(0, 3).join(' | ')}`);
      } else if (createdRows.length > 0) {
        setRows([emptyRow()]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExcelImport = async () => {
    setError('');
    setMessage('');

    if (!excelFile) {
      setError('Please select an Excel file (.xlsx or .xls).');
      return;
    }

    setImportingExcel(true);
    try {
      const response = await authAPI.adminImportUsersExcel(excelFile);
      const data = response?.data || {};
      const createdRows = Array.isArray(data.created) ? data.created : [];
      const failures = Array.isArray(data.failures) ? data.failures : [];

      if (createdRows.length > 0) {
        await exportCreatedCredentials(createdRows);
      }

      const createdCount = Number(data.createdCount || 0);
      const failedCount = Number(data.failedCount || 0);

      if (failedCount > 0) {
        const failurePreview = failures
          .slice(0, 3)
          .map((item) => `row ${item.rowNumber}: ${item.reason}`)
          .join(' | ');
        setError(
          `Excel processed: ${createdCount} created, ${failedCount} failed.${failurePreview ? ` ${failurePreview}` : ''}`
        );
      } else {
        setMessage(`Excel imported successfully. ${createdCount} account(s) created. The Excel file has been downloaded.`);
      }

      setExcelFile(null);
      if (excelInputRef.current) {
        excelInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message || 'Failed to import users from Excel.');
    } finally {
      setImportingExcel(false);
    }
  };

  if (authLoading) {
    return (
      <div className="rounded-2xl border border-edge bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 text-ink-secondary">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-edge-strong border-t-brand" />
          <span>Loading list creation...</span>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-edge bg-surface p-8 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-danger">Restricted Area</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">List creation is not available for this account.</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl min-w-0">
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface shadow-card p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(22,163,74,0.14),transparent_30%)]" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <h1 className="text-2xl font-bold tracking-tight text-ink">Create Users List</h1>
            <p className="mt-1 text-sm text-ink-secondary">Add users in a table and choose roles using checklist boxes.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/admin/users')}
            className="relative rounded-xl border border-edge bg-canvas px-4 py-2 text-sm font-medium text-ink transition hover:border-edge-strong hover:text-brand"
          >
            Back to Admin Users
          </button>
        </div>
      </section>

      {message ? <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success shadow-card">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-edge-strong bg-danger/10 px-4 py-3 text-sm text-danger shadow-card">{error}</div> : null}

      <section className="rounded-2xl border border-edge bg-surface shadow-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Import from Excel</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Upload a spreadsheet to create multiple accounts at once. Required columns: <span className="font-medium">nom, prenom, email, roles</span>.
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">
            Optional columns: telephone, promoId, specialiteId, moduleIds (comma-separated), anneeUniversitaire.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => setExcelFile(event.target.files?.[0] || null)}
            className="block w-full rounded-xl border border-edge bg-canvas px-3 py-2 text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/15"
          />
          <button
            type="button"
            onClick={handleExcelImport}
            disabled={importingExcel}
            className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-surface shadow-sm transition hover:bg-brand-hover disabled:opacity-60"
          >
            {importingExcel ? 'Importing...' : 'Import Excel'}
          </button>
        </div>
      </section>

      <form onSubmit={submitList} className="rounded-2xl border border-edge bg-surface shadow-card p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-edge-subtle bg-cyan-50/80">
                <th className="text-left px-3 py-3 text-ink uppercase text-xs font-semibold">Nom</th>
                <th className="text-left px-3 py-3 text-ink uppercase text-xs font-semibold">Prenom</th>
                <th className="text-left px-3 py-3 text-ink uppercase text-xs font-semibold">Email</th>
                <th className="text-left px-3 py-3 text-ink uppercase text-xs font-semibold">Telephone</th>
                <th className="text-left px-3 py-3 text-ink uppercase text-xs font-semibold">Roles</th>
                <th className="text-right px-3 py-3 text-ink uppercase text-xs font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`row-${index}`} className={`border-b border-edge-subtle ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-200/40'}`}>
                  <td className="px-3 py-2">
                    <input
                      value={row.nom}
                      onChange={(e) => updateRow(index, 'nom', e.target.value)}
                      className="w-full rounded-lg border border-edge bg-canvas px-3 py-2 text-sm focus:border-edge-strong focus:ring-2 focus:ring-cyan-100"
                      placeholder="Nom"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.prenom}
                      onChange={(e) => updateRow(index, 'prenom', e.target.value)}
                      className="w-full rounded-lg border border-edge bg-canvas px-3 py-2 text-sm focus:border-edge-strong focus:ring-2 focus:ring-cyan-100"
                      placeholder="Prenom"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="email"
                      value={row.email}
                      onChange={(e) => updateRow(index, 'email', e.target.value)}
                      className="w-full rounded-lg border border-edge bg-canvas px-3 py-2 text-sm focus:border-edge-strong focus:ring-2 focus:ring-cyan-100"
                      placeholder="email@univ.dz"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.telephone}
                      onChange={(e) => updateRow(index, 'telephone', e.target.value)}
                      className="w-full rounded-lg border border-edge bg-canvas px-3 py-2 text-sm focus:border-edge-strong focus:ring-2 focus:ring-cyan-100"
                      placeholder="055..."
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-3">
                      {ROLE_OPTIONS.map((role) => (
                        <label key={`${index}-${role.value}`} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm transition ${row.roleNames.includes(role.value) ? 'bg-cyan-100 text-cyan-800' : 'bg-canvas text-ink-secondary hover:bg-cyan-50'}`}>
                          <input
                            type="checkbox"
                            className="accent-brand"
                            checked={row.roleNames.includes(role.value)}
                            onChange={() => toggleRole(index, role.value)}
                          />
                          <span>{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:border-danger/30 hover:bg-danger/15"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3">
          <button
            type="button"
            onClick={addRow}
            className="rounded-xl border border-edge-strong bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-edge-strong hover:bg-cyan-100"
          >
            Add row
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-success px-5 py-2 text-sm font-semibold text-surface shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Creating list...' : 'Create List'}
          </button>
        </div>
      </form>
    </div>
  );
}
