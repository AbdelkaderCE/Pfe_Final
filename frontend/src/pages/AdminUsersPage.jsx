import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, GraduationCap, UserCog, ShieldCheck, Download } from 'lucide-react';
import { authAPI, resolveMediaUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../design-system/components';

function isAdminRole(roles) {
  if (!Array.isArray(roles)) return false;
  return roles
    .map((role) => String(role || '').toLowerCase())
    .some((role) => role === 'admin');
}

function getInitials(prenom, nom) {
  return `${prenom?.[0] || '?'}${nom?.[0] || '?'}`.toUpperCase();
}

function roleLabel(roleName) {
  if (roleName === 'admin') return 'Admin';
  if (roleName === 'enseignant') return 'Teacher';
  if (roleName === 'etudiant') return 'Student';
  return roleName;
}

const BASE_CREATION_ROLE_NAMES = ['admin', 'enseignant', 'etudiant'];
const STUDENT_TRACK_ROLE_NAMES = ['etudiant'];

function getRoleTrack(roleName) {
  if (STUDENT_TRACK_ROLE_NAMES.includes(roleName)) return 'student';
  return 'staff';
}

function detectUserTrack(roleNames = []) {
  return roleNames.some((roleName) => getRoleTrack(roleName) === 'student') ? 'student' : 'staff';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const inputClassName = 'w-full rounded-md border border-control-border bg-control-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30';
const sectionClassName = 'rounded-lg border border-edge bg-surface shadow-card';

let html2pdfLoader = null;

const getHtml2Pdf = async () => {
  if (!html2pdfLoader) {
    html2pdfLoader = import('html2pdf.js/dist/html2pdf.bundle.min.js').then((module) => module.default || module);
  }

  return html2pdfLoader;
};

const waitForNodeImages = async (container) => {
  const images = Array.from(container.querySelectorAll('img'));
  if (!images.length) return;

  await Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();

    return new Promise((resolve) => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }));
};

const exportHtmlAsPdf = async ({ html, fileName }) => {
  // Use native print dialog to match AdminUsersListPage.jsx perfectly
  // This completely eliminates "blank page" bugs from html2pdf.js and ensures crisp, selectable text.
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Veuillez autoriser les pop-ups pour générer le PDF.");
    return;
  }

  const title = fileName ? fileName.replace('.pdf', '') : 'Export PDF';
  const fullHtml = html.includes('<!DOCTYPE html>') ? html : `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  printWindow.document.write(fullHtml);
  printWindow.document.close();

  // Short delay to ensure browser paints the DOM (and loads base64 logo) before print dialog opens
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
};

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const hasLoadedDataRef = useRef(false);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingByUserId, setSavingByUserId] = useState({});
  const [editingRolesByUserId, setEditingRolesByUserId] = useState({});
  const [editingStatusByUserId, setEditingStatusByUserId] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastCreatedCredentials, setLastCreatedCredentials] = useState(null);
  const [credentialRegistry, setCredentialRegistry] = useState([]);
  const [pdfExportingScope, setPdfExportingScope] = useState('');
  const [saasExportingScope, setSaasExportingScope] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const [formMeta, setFormMeta] = useState({
    universityName: 'Université Ibn Khaldoun - Tiaret',
    facultyName: 'Faculté des Sciences et Technologies',
    departmentName: 'Département Informatique',
  });

  const [createForm, setCreateForm] = useState({
    email: '',
    nom: '',
    prenom: '',
    sexe: '',
    telephone: '',
    roleNames: [],
  });
  const [creatingUser, setCreatingUser] = useState(false);

  /* Master/detail picker state — mirrors AdminHistoryPage */
  const [usersTab, setUsersTab] = useState('all');
  const [usersSearch, setUsersSearch] = useState('');
  const [debouncedUsersSearch, setDebouncedUsersSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const usersSearchDebounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(usersSearchDebounceRef.current);
    usersSearchDebounceRef.current = setTimeout(() => setDebouncedUsersSearch(usersSearch), 300);
    return () => clearTimeout(usersSearchDebounceRef.current);
  }, [usersSearch]);

  const canAccess = useMemo(() => isAdminRole(user?.roles), [user?.roles]);
  const credentialRows = useMemo(() => {
    return credentialRegistry
      .map((entry) => {
        const liveUser = users.find((u) => u.id === entry.userId);
        return {
          ...entry,
          nom: liveUser?.nom || entry.nom,
          prenom: liveUser?.prenom || entry.prenom,
          email: liveUser?.email || entry.email,
          telephone: liveUser?.telephone || entry.telephone || '',
          roles: liveUser?.roles || entry.roles || [],
        };
      })
      .filter((entry) => entry.tempPassword);
  }, [credentialRegistry, users]);

  const studentCredentialRows = useMemo(
    () => credentialRows.filter((entry) => entry.source === 'bulk' && (entry.roles || []).includes('etudiant')),
    [credentialRows]
  );

  const teacherCredentialRows = useMemo(
    () => credentialRows.filter((entry) => entry.source === 'bulk' && (entry.roles || []).includes('enseignant')),
    [credentialRows]
  );

  const baseCreationRoles = useMemo(
    () => roles.filter((role) => BASE_CREATION_ROLE_NAMES.includes(role.nom)),
    [roles]
  );
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((entry) => entry.status === 'active').length;
    const adminUsers = users.filter((entry) => isAdminRole(entry.roles || [])).length;
    const suspendedUsers = users.filter((entry) => entry.status === 'suspended').length;

    return [
      { label: 'Total Users', value: totalUsers, tone: 'text-ink' },
      { label: 'Active Accounts', value: activeUsers, tone: 'text-success' },
      { label: 'Admin Accounts', value: adminUsers, tone: 'text-brand' },
      { label: 'Suspended', value: suspendedUsers, tone: 'text-danger' },
    ];
  }, [users]);

  // Load default logo from public folder on component mount
  useEffect(() => {
    const loadDefaultLogo = async () => {
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
    
    loadDefaultLogo();
  }, []);

  useEffect(() => {
    if (!lastCreatedCredentials) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLastCreatedCredentials(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastCreatedCredentials]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [usersRes, rolesRes] = await Promise.all([
        authAPI.adminGetUsers(),
        authAPI.adminGetRoles(),
      ]);

      const usersData = Array.isArray(usersRes?.data) ? usersRes.data : [];
      const rolesData = Array.isArray(rolesRes?.data) ? rolesRes.data : [];

      setUsers(usersData);
      setRoles(rolesData);
      setEditingRolesByUserId(
        Object.fromEntries(usersData.map((u) => [u.id, [...(u.roles || [])]]))
      );
      setEditingStatusByUserId(
        Object.fromEntries(usersData.map((u) => [u.id, u.status || 'active']))
      );
    } catch (err) {
      setError(err.message || 'Failed to load admin users data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess || hasLoadedDataRef.current) return;
    hasLoadedDataRef.current = true;
    loadData();
  }, [canAccess]);

  const selectCreateRole = (roleName) => {
    setCreateForm((prev) => ({ ...prev, roleNames: [roleName] }));
  };

  const toggleUserRole = (userId, roleName) => {
    setEditingRolesByUserId((prev) => {
      const current = prev[userId] || [];
      const next = current.includes(roleName)
        ? current.filter((r) => r !== roleName)
        : [...current, roleName];
      return { ...prev, [userId]: next };
    });
  };

  const upsertCredentialEntry = (entry) => {
    setCredentialRegistry((prev) => {
      const index = prev.findIndex((item) => item.userId === entry.userId || item.email === entry.email);
      if (index === -1) {
        return [entry, ...prev];
      }

      const next = [...prev];
      next[index] = {
        ...next[index],
        ...entry,
      };
      return next;
    });
  };

  const createSingleUser = async (payload, source = 'single') => {
    const res = await authAPI.adminCreateUser(payload);
    const createdUser = res?.data?.user;
    const tempPassword = res?.data?.tempPassword;

    if (createdUser?.email && tempPassword) {
      upsertCredentialEntry({
        userId: createdUser.id,
        email: createdUser.email,
        nom: createdUser.nom || payload.nom,
        prenom: createdUser.prenom || payload.prenom,
        telephone: payload.telephone || '',
        roles: createdUser.roles || payload.roleNames,
        tempPassword,
        generatedAt: new Date().toISOString(),
        source,
      });
    }

    return { createdUser, tempPassword };
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (createForm.roleNames.length !== 1) {
      setError('Please select exactly one role for the new user.');
      return;
    }

    setCreatingUser(true);
    try {
      const payload = {
        email: createForm.email.trim(),
        nom: createForm.nom.trim(),
        prenom: createForm.prenom.trim(),
        roleNames: createForm.roleNames,
        sexe: createForm.sexe || undefined,
        telephone: createForm.telephone.trim() || undefined,
      };

      const { createdUser, tempPassword } = await createSingleUser(payload, 'single');

      if (createdUser?.email && tempPassword) {
        setLastCreatedCredentials({
          email: createdUser.email,
          fullName: `${createdUser.prenom || payload.prenom} ${createdUser.nom || payload.nom}`.trim(),
          roles: createdUser.roles || payload.roleNames,
          tempPassword,
          createdAt: new Date().toLocaleString(),
        });
      }

      setMessage('User created successfully. The temporary credentials window is now open.');

      setCreateForm({
        email: '',
        nom: '',
        prenom: '',
        sexe: '',
        telephone: '',
        roleNames: [],
      });

      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setCreatingUser(false);
    }
  };

  const saveUserRoles = async (userId) => {
    const roleNames = editingRolesByUserId[userId] || [];
    if (!roleNames.length) {
      setError('Each user must have at least one role.');
      return;
    }

    setSavingByUserId((prev) => ({ ...prev, [userId]: true }));
    setError('');
    setMessage('');

    try {
      const res = await authAPI.adminUpdateUserRoles(userId, roleNames);
      const updatedUser = res?.data;
      if (updatedUser?.id) {
        setUsers((prev) => prev.map((u) => (
          u.id === updatedUser.id
            ? { ...u, roles: updatedUser.roles || u.roles }
            : u
        )));
      }
      setMessage('User roles updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update user roles.');
    } finally {
      setSavingByUserId((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const saveUserStatus = async (userId) => {
    const status = editingStatusByUserId[userId] || 'active';

    setSavingByUserId((prev) => ({ ...prev, [userId]: true }));
    setError('');
    setMessage('');

    try {
      const res = await authAPI.adminUpdateUserStatus(userId, status);
      const updatedUser = res?.data;
      if (updatedUser?.id) {
        setUsers((prev) => prev.map((u) => (
          u.id === updatedUser.id
            ? {
                ...u,
                status: updatedUser.status || u.status,
                roles: updatedUser.roles || u.roles,
              }
            : u
        )));
      }
      setMessage('User status updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    } finally {
      setSavingByUserId((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const copyToClipboard = async (text, successLabel) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(successLabel);
    } catch {
      setError('Unable to copy automatically. Please copy it manually.');
    }
  };

  const handleResetUserPassword = async (targetUser) => {
    if (!targetUser?.id) return;

    setSavingByUserId((prev) => ({ ...prev, [targetUser.id]: true }));
    setError('');
    setMessage('');

    try {
      const res = await authAPI.adminResetPassword(targetUser.id);
      const tempPassword = res?.data?.tempPassword;

      if (!tempPassword) {
        throw new Error('Temporary password was not returned by the server.');
      }

      upsertCredentialEntry({
        userId: targetUser.id,
        email: targetUser.email,
        nom: targetUser.nom,
        prenom: targetUser.prenom,
        telephone: targetUser.telephone || '',
        roles: targetUser.roles || [],
        tempPassword,
        generatedAt: new Date().toISOString(),
      });

      setLastCreatedCredentials({
        email: targetUser.email,
        fullName: `${targetUser.prenom} ${targetUser.nom}`.trim(),
        roles: targetUser.roles || [],
        tempPassword,
        createdAt: new Date().toLocaleString(),
      });

      setMessage(`Temporary password reset for ${targetUser.prenom} ${targetUser.nom}.`);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setSavingByUserId((prev) => ({ ...prev, [targetUser.id]: false }));
    }
  };

  const buildOfficialRowsTable = (title, rows) => {
    const renderedRows = rows
      .map((row, index) => {
        return `
          <tr>
            <td style="border: 1px solid #000000; padding: 8px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(row.nom || '')}</td>
            <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(row.prenom || '')}</td>
            <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(row.email)}</td>
            <td style="border: 1px solid #000000; padding: 8px;">${escapeHtml(row.telephone || '-')}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <h3 style="margin-top: 20px; margin-bottom: 10px;">${escapeHtml(title)}</h3>
      <table style="border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #e8e8e8;">
            <th style="border: 1px solid #000000; padding: 8px; text-align: center;">N°</th>
            <th style="border: 1px solid #000000; padding: 8px;">Nom</th>
            <th style="border: 1px solid #000000; padding: 8px;">Prénom</th>
            <th style="border: 1px solid #000000; padding: 8px;">Email</th>
            <th style="border: 1px solid #000000; padding: 8px;">Téléphone</th>
          </tr>
        </thead>
        <tbody>
          ${renderedRows || '<tr><td colspan="5" style="text-align: center;">Aucune donnée</td></tr>'}
        </tbody>
      </table>
    `;
  };

  const buildOfficialDocumentHtml = ({ title, rows, dateLabel }) => {
    const logoHtml = logoBase64
      ? `<div style="text-align: center; margin: 20px 0;"><img src="${logoBase64}" style="max-width: 120px; max-height: 120px; width: auto; height: auto;" /></div>`
      : '';

    return `
      <div class="export-root">
        <style>
          .export-root * { margin: 0; padding: 0; box-sizing: border-box; }
          .export-root { font-family: 'Arial', 'Calibri', sans-serif; padding: 20px; color: #000000; background: #ffffff; min-height: 100vh; }
          .export-root .document-container { max-width: 1200px; margin: 0 auto; background: #ffffff; }
          .export-root .header { text-align: center; margin-bottom: 30px; padding: 20px; }
          .export-root .arabic-text { font-family: 'Traditional Arabic', 'Arial', sans-serif; font-size: 16px; margin: 10px 0; }
          .export-root .title { font-size: 20px; font-weight: bold; margin: 20px 0 10px 0; text-align: center; }
          .export-root .rule { border-top: 2px solid #000000; margin: 15px 0; }
          .export-root .date-info { text-align: right; margin: 20px 0; font-size: 12px; }
          .export-root table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
          .export-root th { border: 1px solid #000000; padding: 10px 8px; background-color: #e8e8e8 !important; font-weight: bold; text-align: center; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .export-root td { border: 1px solid #000000; padding: 8px; vertical-align: top; }
        </style>
        <div class="document-container">
          <div class="header">
            <div class="arabic-text">
              <strong>الجمهورية الجزائرية الديمقراطية الشعبية</strong><br/>
              <strong>وزارة التعليم العالي و البحث العلمي</strong>
            </div>

            ${logoHtml}

            <div style="margin: 20px 0;">
              <strong>${escapeHtml(formMeta.universityName)}</strong><br/>
              Faculté : ${escapeHtml(formMeta.facultyName)}<br/>
              Département : ${escapeHtml(formMeta.departmentName)}
            </div>

            <div class="rule"></div>
            <div class="title">${escapeHtml(title)}</div>
            <div class="rule"></div>

            <div class="date-info">Date : ${escapeHtml(dateLabel)}</div>
          </div>

          ${buildOfficialRowsTable(title, rows)}
        </div>
      </div>
    `;
  };

  /* ─────────────────────────────────────────────────────────────────
     SaaS-style PDF template
     Design tokens are hard-resolved from index.css so the PDF engine
     never needs to evaluate CSS variables or load any framework.
     ───────────────────────────────────────────────────────────────── */
  const buildSaasListHtml = ({ title, rows, dateLabel }) => {
    /* -- Resolved design tokens (from index.css light theme) --------- */
    const C = {
      canvas:      '#f8f9fb',
      surface:     '#ffffff',
      surface200:  '#f4f5f7',
      ink:         '#1a1d23',
      inkSec:      '#4b5160',
      inkTert:     '#7c8294',
      inkMuted:    '#a9aeb8',
      edge:        '#e6e8eb',       // rgba(0,0,0,0.08) resolved on white
      edgeSubtle:  '#f0f1f3',       // rgba(0,0,0,0.05) resolved on white
      edgeStrong:  '#d6d8dc',       // rgba(0,0,0,0.14) resolved on white
      brand:       '#2563eb',
      brandLight:  '#eff6ff',
      brandBorder: '#bfdbfe',
      shadow:      '0 2px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
    };

    const logoHtml = logoBase64
      ? `<div class="logo-wrap"><img src="${logoBase64}" alt="Logo université" /></div>`
      : '';

    const tableRows = rows.length === 0
      ? `<tr><td colspan="4" class="empty-cell">Aucun utilisateur à afficher</td></tr>`
      : rows.map((row, idx) => {
          const fullName = `${escapeHtml(row.prenom || '')} ${escapeHtml(row.nom || '')}`.trim() || '—';
          const email    = escapeHtml(row.email || '—');
          const phone    = row.telephone
            ? escapeHtml(row.telephone)
            : '<span class="no-phone">—</span>';
          const evenBg   = idx % 2 === 1 ? `background:#fafafa;` : '';
          return `
            <tr style="${evenBg}">
              <td class="col-idx">${idx + 1}</td>
              <td class="col-name">${fullName}</td>
              <td class="col-email">${email}</td>
              <td class="col-phone">${phone}</td>
            </tr>`;
        }).join('');

    return `
<div class="pdf-export-root">
<style>
/* ── Reset ─────────────────────────────────────────────────────── */
.pdf-export-root *, .pdf-export-root *::before, .pdf-export-root *::after{margin:0;padding:0;box-sizing:border-box;}

/* ── Root ──────────────────────────────────────────────────────── */
.pdf-export-root {
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
  font-size:13px;
  line-height:1.5;
  color:${C.ink};
  background:${C.canvas};
  padding:24px;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}

/* ── Page wrapper ───────────────────────────────────────────────── */
.pdf-export-root .page{max-width:760px;margin:0 auto;}

/* ── Letterhead card ────────────────────────────────────────────── */
.pdf-export-root .letterhead{
  background:${C.surface};
  border:1px solid ${C.edge};
  border-radius:16px;
  box-shadow:${C.shadow};
  padding:24px 28px;
  margin-bottom:12px;
  text-align:center;
}
.pdf-export-root .ministry{
  font-size:13px;font-weight:600;color:${C.ink};
  line-height:1.8;direction:rtl;text-align:center;margin-bottom:10px;
}
.pdf-export-root .logo-wrap{margin:10px auto;}
.pdf-export-root .logo-wrap img{width:64px;height:64px;object-fit:contain;}
.pdf-export-root .uni-block{font-size:12px;color:${C.inkSec};line-height:1.8;margin:10px 0;}
.pdf-export-root .uni-block strong{font-size:14px;font-weight:700;color:${C.ink};display:block;margin-bottom:2px;}
.pdf-export-root .rule{border:none;border-top:2px solid ${C.edge};margin:14px 0;}
.pdf-export-root .doc-title{
  font-size:16px;font-weight:700;letter-spacing:-0.01em;
  color:${C.ink};margin:6px 0 3px;
}
.pdf-export-root .doc-date{font-size:11px;color:${C.inkTert};}

/* ── Table card ─────────────────────────────────────────────────── */
.pdf-export-root .table-card{
  background:${C.surface};
  border:1px solid ${C.edge};
  border-radius:16px;
  box-shadow:${C.shadow};
  overflow:hidden;
}
.pdf-export-root .card-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 18px;border-bottom:1px solid ${C.edgeSubtle};
}
.pdf-export-root .card-title{font-size:13px;font-weight:600;color:${C.ink};}
.pdf-export-root .badge{
  font-size:11px;font-weight:600;color:${C.brand};
  background:${C.brandLight};border:1px solid ${C.brandBorder};
  border-radius:999px;padding:2px 10px;white-space:nowrap;
}

/* ── Table ──────────────────────────────────────────────────────── */
.pdf-export-root table{width:100%;border-collapse:collapse;font-size:12px;}

.pdf-export-root thead tr{background:${C.surface200};-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.pdf-export-root thead th{
  padding:9px 14px;font-size:10px;font-weight:600;
  text-transform:uppercase;letter-spacing:0.08em;
  color:${C.inkTert};text-align:left;
  border-bottom:1px solid ${C.edge};
}
.pdf-export-root thead th.col-idx{text-align:center;width:48px;}

.pdf-export-root tbody tr{border-bottom:1px solid ${C.edgeSubtle};}
.pdf-export-root tbody tr:last-child{border-bottom:none;}

.pdf-export-root tbody td{padding:10px 14px;color:${C.ink};vertical-align:middle;}
.pdf-export-root tbody td.col-idx{
  text-align:center;font-size:11px;font-weight:500;color:${C.inkTert};
  background:${C.canvas};border-right:1px solid ${C.edgeSubtle};
  width:48px;-webkit-print-color-adjust:exact;print-color-adjust:exact;
}
.pdf-export-root .col-name{font-weight:500;color:${C.ink};}
.pdf-export-root .col-email{color:${C.inkSec};font-size:11.5px;}
.pdf-export-root .col-phone{color:${C.inkSec};font-size:11.5px;}
.pdf-export-root .no-phone{color:${C.inkMuted};font-style:italic;}
.pdf-export-root .empty-cell{
  text-align:center;padding:28px 14px;
  color:${C.inkTert};font-size:12px;font-style:italic;
}

/* ── Footer ─────────────────────────────────────────────────────── */
.pdf-export-root .doc-footer{
  margin-top:16px;padding:0 2px;
  display:flex;align-items:flex-start;justify-content:space-between;
}
.pdf-export-root .footer-note{font-size:10px;color:${C.inkTert};line-height:1.6;}
.pdf-export-root .sig-zone{text-align:right;min-width:180px;}
.pdf-export-root .sig-label{
  font-size:9.5px;font-weight:600;text-transform:uppercase;
  letter-spacing:0.06em;color:${C.inkTert};margin-bottom:28px;
}
.pdf-export-root .sig-line{
  border-top:1px solid ${C.edgeStrong};
  width:160px;margin-left:auto;
  padding-top:5px;font-size:9.5px;
  color:${C.inkTert};text-align:center;
}

/* ── Print overrides ────────────────────────────────────────────── */
@media print{
  .pdf-export-root {background:${C.surface};padding:0;}
  .pdf-export-root .table-card, .pdf-export-root .letterhead{box-shadow:none;}
}
</style>

<div class="page">
  <!-- Letterhead -->
  <div class="letterhead">
    <div class="ministry">
      <strong>الجمهورية الجزائرية الديمقراطية الشعبية</strong><br/>
      <strong>وزارة التعليم العالي و البحث العلمي</strong>
    </div>

    ${logoHtml}

    <div class="uni-block">
      <strong>${escapeHtml(formMeta.universityName)}</strong>
      ${escapeHtml(formMeta.facultyName)}<br/>
      Département : ${escapeHtml(formMeta.departmentName)}
    </div>

    <hr class="rule" />
    <div class="doc-title">${escapeHtml(title)}</div>
    <div class="doc-date">Tiaret, le ${escapeHtml(dateLabel)}</div>
  </div>

  <!-- Table card -->
  <div class="table-card">
    <div class="card-header">
      <span class="card-title">Liste des utilisateurs</span>
      <span class="badge">${rows.length} utilisateur${rows.length !== 1 ? 's' : ''}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th class="col-idx">N°</th>
          <th>Nom et Prénom</th>
          <th>Email</th>
          <th>Téléphone</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="doc-footer">
    <div class="footer-note">
      Document généré le ${escapeHtml(dateLabel)}<br/>
      ${escapeHtml(formMeta.universityName)}
    </div>
    <div class="sig-zone">
      <div class="sig-label">Visa du responsable</div>
      <div class="sig-line">Signature &amp; Cachet</div>
    </div>
  </div>
</div>
</div>`;
  };

  const exportSaasUsersPdf = async (scope) => {
    setError('');
    setMessage('');
    setSaasExportingScope(scope);

    try {
      const res = await authAPI.adminGetUsers();
      const allUsers = Array.isArray(res?.data) ? res.data : [];

      let filtered = allUsers;
      let title = 'LISTE DES UTILISATEURS';
      if (scope === 'students') {
        filtered = allUsers.filter((u) => (u.roles || []).includes('etudiant'));
        title = 'LISTE DES ÉTUDIANTS';
      } else if (scope === 'teachers') {
        filtered = allUsers.filter((u) => (u.roles || []).includes('enseignant'));
        title = 'LISTE DES ENSEIGNANTS';
      }

      if (!filtered.length) {
        setError('Aucun utilisateur trouvé pour ce périmètre.');
        return;
      }

      const rows = filtered.map((u) => ({
        nom:       u.nom       || '',
        prenom:    u.prenom    || '',
        email:     u.email     || '',
        telephone: u.telephone || '',
      }));

      const today     = new Date();
      const dateLabel = today.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      const dateStamp = today.toISOString().slice(0, 10);

      const html = buildSaasListHtml({ title, rows, dateLabel });
      await exportHtmlAsPdf({ html, fileName: `liste_${scope}_${dateStamp}.pdf` });
      setMessage(`Export PDF généré : liste_${scope}_${dateStamp}.pdf`);
    } catch (err) {
      setError(`Export échoué : ${err.message}`);
    } finally {
      setSaasExportingScope('');
    }
  };

  const exportOfficialCredentialLists = async () => {
    setError('');
    setMessage('');

    try {
      const usersResponse = await authAPI.adminGetUsers();
      const allUsers = Array.isArray(usersResponse?.data) ? usersResponse.data : [];

      const studentUsers = allUsers.filter((u) => (u.roles || []).includes('etudiant'));
      const teacherUsers = allUsers.filter((u) => (u.roles || []).includes('enseignant'));

      const studentData = studentUsers.map((user) => ({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        telephone: user.telephone || '',
      }));

      const teacherData = teacherUsers.map((user) => ({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        telephone: user.telephone || '',
      }));

      if (!studentData.length && !teacherData.length) {
        setError('No student or teacher users found to export.');
        return;
      }

      const today = new Date();
      const dateLabel = today.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const dateStamp = today.toISOString().slice(0, 10);

      if (studentData.length) {
        const studentHtml = buildOfficialDocumentHtml({
          title: 'FICHE DE CRÉATION - ÉTUDIANTS',
          rows: studentData,
          dateLabel,
        });

        await exportHtmlAsPdf({
          html: studentHtml,
          fileName: `liste_etudiants_${dateStamp}.pdf`,
        });
      }

      if (teacherData.length) {
        const teacherHtml = buildOfficialDocumentHtml({
          title: 'FICHE DE CRÉATION - ENSEIGNANTS',
          rows: teacherData,
          dateLabel,
        });

        await exportHtmlAsPdf({
          html: teacherHtml,
          fileName: `liste_enseignants_${dateStamp}.pdf`,
        });
      }

      setMessage('Two separate PDF exports were generated for students and teachers (when data exists).');
    } catch (err) {
      console.error('Export error:', err);
      setError(`Export failed: ${err.message}`);
    }
  };

  const exportOfficialUsersPdf = async (scope) => {
    setError('');
    setMessage('');
    setPdfExportingScope(scope);

    try {
      const res = await authAPI.adminGetUsers();
      const allUsers = Array.isArray(res?.data) ? res.data : [];

      let filtered = allUsers;
      let title = 'LISTE DES UTILISATEURS';
      if (scope === 'students') {
        filtered = allUsers.filter((u) => (u.roles || []).includes('etudiant'));
        title = 'LISTE DES ÉTUDIANTS';
      } else if (scope === 'teachers') {
        filtered = allUsers.filter((u) => (u.roles || []).includes('enseignant'));
        title = 'LISTE DES ENSEIGNANTS';
      }

      if (!filtered.length) {
        setError('Aucun utilisateur trouvé pour ce périmètre.');
        return;
      }

      const rows = filtered.map((u) => ({
        nom:       u.nom       || '',
        prenom:    u.prenom    || '',
        email:     u.email     || '',
        telephone: u.telephone || '',
      }));

      const today = new Date();
      const dateLabel = today.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const dateStamp = today.toISOString().slice(0, 10);

      const html = buildOfficialDocumentHtml({ title, rows, dateLabel });
      await exportHtmlAsPdf({ html, fileName: `liste_officielle_${scope}_${dateStamp}.pdf` });

      setMessage('Official PDF export generated successfully.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate official users PDF export.');
    } finally {
      setPdfExportingScope('');
    }
  };

  /* ── Master/detail derived data (matches AdminHistoryPage pattern) ── */
  const USER_TABS = {
    all:     { label: 'All',      icon: Users => null }, // icon set inline in render
    student: { label: 'Students', match: (u) => (u.roles || []).includes('etudiant') },
    teacher: { label: 'Teachers', match: (u) => (u.roles || []).includes('enseignant') },
    admin:   { label: 'Admins',   match: (u) => (u.roles || []).includes('admin') },
  };

  const filteredPickerUsers = useMemo(() => {
    const q = debouncedUsersSearch.trim().toLowerCase();
    return users
      .filter((u) => {
        if (usersTab === 'all') return true;
        if (usersTab === 'student') return (u.roles || []).includes('etudiant');
        if (usersTab === 'teacher') return (u.roles || []).includes('enseignant');
        if (usersTab === 'admin') return (u.roles || []).includes('admin');
        return true;
      })
      .filter((u) => {
        if (!q) return true;
        const roleLabels = (u.roles || []).map((r) => roleLabel(r).toLowerCase());
        return (
          String(u.prenom || '').toLowerCase().includes(q) ||
          String(u.nom || '').toLowerCase().includes(q) ||
          String(u.email || '').toLowerCase().includes(q) ||
          roleLabels.some((rl) => rl.includes(q))
        );
      });
  }, [users, usersTab, debouncedUsersSearch]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  if (authLoading || loading) {
    return (
      <div className="rounded-2xl border border-edge bg-surface p-8 shadow-card">
        <div className="flex items-center gap-3 text-ink-secondary">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-edge-strong border-t-brand" />
          <span>Loading user management...</span>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-edge bg-surface p-8 shadow-card">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-danger">Restricted Area</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">User management is not available for this account.</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Only administrators and vice deans can create accounts, assign roles, and manage access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl min-w-0">
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface shadow-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_28%)]" />
        <div className="relative px-6 py-7 md:px-7 md:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Administration</p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink md:text-3xl">Admin User Management</h1>
              <p className="mt-2 text-sm leading-6 text-ink-secondary md:text-base">
                Create institutional accounts, assign multiple roles, and keep access clean across the platform.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[440px]">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-edge bg-canvas/90 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-ink-tertiary">{stat.label}</p>
                  <p className={`mt-2 text-2xl font-bold tracking-tight ${stat.tone}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {message ? <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success shadow-card">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-edge-strong bg-danger/10 px-4 py-3 text-sm text-danger shadow-card">{error}</div> : null}

      <section className={`${sectionClassName} p-6`}>
        <div className="flex flex-col gap-2 border-b border-edge-subtle pb-5">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Official PDF Lists</h2>
          <p className="text-sm text-ink-secondary">
            Generate official user registries with formal header, page numbers, and alternating row colors.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <Button
            type="button"
            onClick={() => exportOfficialUsersPdf('all')}
            loading={pdfExportingScope === 'all'}
            variant="primary"
            size="md"
          >
            <Download className="h-4 w-4" />
            Export All Users
          </Button>
          <Button
            type="button"
            onClick={() => exportOfficialUsersPdf('teachers')}
            loading={pdfExportingScope === 'teachers'}
            variant="secondary"
            size="md"
          >
            <Download className="h-4 w-4" />
            Export Teachers
          </Button>
          <Button
            type="button"
            onClick={() => exportOfficialUsersPdf('students')}
            loading={pdfExportingScope === 'students'}
            variant="secondary"
            size="md"
          >
            <Download className="h-4 w-4" />
            Export Students
          </Button>
        </div>


        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Université</span>
            <input
              type="text"
              value={formMeta.universityName}
              onChange={(e) => setFormMeta((prev) => ({ ...prev, universityName: e.target.value }))}
              className={inputClassName}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Faculté</span>
            <input
              type="text"
              value={formMeta.facultyName}
              onChange={(e) => setFormMeta((prev) => ({ ...prev, facultyName: e.target.value }))}
              className={inputClassName}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Département</span>
            <input
              type="text"
              value={formMeta.departmentName}
              onChange={(e) => setFormMeta((prev) => ({ ...prev, departmentName: e.target.value }))}
              className={inputClassName}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <Button
            type="button"
            onClick={exportOfficialCredentialLists}
            variant="secondary"
            size="md"
          >
            Export legacy student/teacher credential PDFs
          </Button>
        </div>
      </section>

      {/* Rest of the component remains the same */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <div className={`${sectionClassName} p-6`}>
          <div className="flex flex-col gap-2 border-b border-edge-subtle pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-ink">Create New User</h2>
              <p className="mt-1 text-sm text-ink-secondary">Single-user creation is managed here. Use the dedicated list page for table-based bulk creation.</p>
            </div>
            <div className="rounded-md border border-edge-strong bg-brand-light px-3 py-1.5 text-xs font-medium text-brand">
              {roles.length} roles available
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => navigate('/dashboard/admin/users/list-create')}
              variant="primary"
              size="md"
            >
              Open list creation page
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/dashboard/admin/academic/management')}
              variant="secondary"
              size="md"
            >
              Open academic structure page
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/dashboard/admin/academic/assignments')}
              variant="secondary"
              size="md"
            >
              Open assignments page
            </Button>
          </div>

          <form onSubmit={handleCreateUser} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Email</span>
                <input
                  type="email"
                  placeholder="name@univ-ibn-khaldoun.dz"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={inputClassName}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">First Name</span>
                <input
                  type="text"
                  placeholder="Prenom"
                  value={createForm.prenom}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, prenom: e.target.value }))}
                  className={inputClassName}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Last Name</span>
                <input
                  type="text"
                  placeholder="Nom"
                  value={createForm.nom}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, nom: e.target.value }))}
                  className={inputClassName}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Phone</span>
                <input
                  type="text"
                  placeholder="Optional"
                  value={createForm.telephone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, telephone: e.target.value }))}
                  className={inputClassName}
                />
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Sexe</label>
              <div className="flex flex-wrap gap-2">
                {['', 'H', 'F'].map((value) => (
                  <button
                    key={value || 'none'}
                    type="button"
                    onClick={() => setCreateForm((prev) => ({ ...prev, sexe: value }))}
                    className={`rounded-md border px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand/30 ${
                      createForm.sexe === value
                        ? 'border-brand bg-brand-light text-brand shadow-sm'
                        : 'border-edge bg-surface text-ink-secondary hover:bg-surface-200 hover:text-ink'
                    }`}
                  >
                    {value || 'Not set'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-ink">Role <span className="text-xs font-normal text-ink-tertiary">(select one)</span></label>
                <span className="text-xs text-ink-tertiary">
                  {createForm.roleNames[0] ? roleLabel(createForm.roleNames[0]) : 'None selected'}
                </span>
              </div>
              {!roles.length ? (
                <div className="rounded-md border border-edge-strong bg-danger/10 px-4 py-3 text-sm text-danger">
                  No roles found. Make sure your backend has roles data and your account has admin access.
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="User role">
                {baseCreationRoles.map((role) => {
                  const selected = createForm.roleNames[0] === role.nom;
                  return (
                    <label
                      key={role.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-all duration-150 ${
                        selected
                          ? 'border-brand bg-brand-light/70 text-ink shadow-sm'
                          : 'border-edge bg-canvas text-ink-secondary hover:border-edge-strong hover:text-ink'
                      }`}
                    >
                      <input
                        type="radio"
                        name="create-user-role"
                        className="mt-0.5 accent-brand"
                        checked={selected}
                        onChange={() => selectCreateRole(role.nom)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{roleLabel(role.nom)}</span>
                        <span className="mt-1 block text-xs text-ink-tertiary">{role.description || 'Institutional access role'}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-edge-subtle pt-5">
              <Button
                type="submit"
                loading={creatingUser}
                variant="primary"
                size="md"
              >
                {creatingUser ? 'Creating...' : 'Create User'}
              </Button>
              <p className="text-sm text-ink-tertiary">The temporary password will appear in a secure pop-up after creation.</p>
            </div>
          </form>
        </div>

        <aside className={`${sectionClassName} p-6`}>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Admin Checklist</h2>
          <p className="mt-1 text-sm text-ink-secondary">A quick reference so account creation stays consistent.</p>

          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-edge bg-canvas px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Before Creating</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
                <li>Use the institutional email address.</li>
                <li>Assign all required roles now to avoid partial access.</li>
                <li>Only fill phone and sexe when that data is known.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-edge-strong bg-brand-light px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">Academic Workflow</p>
              <p className="mt-2 text-xs text-brand">Use dedicated pages for structure creation and assignments.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => navigate('/dashboard/admin/academic/management')}
                  variant="primary"
                  size="sm"
                >
                  Go to Academic Structure
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate('/dashboard/admin/academic/assignments')}
                  variant="secondary"
                  size="sm"
                >
                  Go to Assignments
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-warning/25 bg-warning/10 px-4 py-4">
              <p className="text-sm font-semibold text-ink">Password Handling</p>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">
                The temporary password is displayed once. Copy it from the modal window and deliver it securely to the user.
              </p>
            </div>
          </div>
        </aside>
      </section>

      {lastCreatedCredentials ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setLastCreatedCredentials(null)}
        >
          <section
            className="w-full max-w-2xl rounded-2xl border border-warning/40 bg-surface shadow-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">New User Credentials</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  Save this password now. It is shown once and cannot be read later from the database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLastCreatedCredentials(null)}
                className="rounded-md border border-edge bg-canvas px-3 py-1.5 text-sm font-medium text-ink-secondary hover:text-ink"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                <div className="rounded-md border border-edge bg-canvas px-3 py-3">
                  <p className="text-xs text-ink-tertiary">Full Name</p>
                  <p className="font-medium text-ink break-words">{lastCreatedCredentials.fullName || 'Not available'}</p>
                </div>
                <div className="rounded-md border border-edge bg-canvas px-3 py-3">
                  <p className="text-xs text-ink-tertiary">User Email</p>
                  <p className="font-medium text-ink break-all">{lastCreatedCredentials.email}</p>
                </div>
                <div className="rounded-md border border-edge bg-canvas px-3 py-3">
                  <p className="text-xs text-ink-tertiary">Assigned Roles</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(lastCreatedCredentials.roles || []).map((roleName) => (
                      <span key={roleName} className="rounded-full bg-brand-light px-2 py-1 text-xs font-medium text-brand">
                        {roleLabel(roleName)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-edge bg-canvas px-3 py-3">
                  <p className="text-xs text-ink-tertiary">Generated At</p>
                  <p className="font-medium text-ink">{lastCreatedCredentials.createdAt}</p>
                </div>
              </div>

              <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Temporary Password</p>
                <p className="mt-2 break-all font-mono text-lg text-ink">{lastCreatedCredentials.tempPassword}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(lastCreatedCredentials.tempPassword, 'Temporary password copied to clipboard.')}
                  className="px-3 py-2 rounded-md bg-brand text-surface text-sm font-medium"
                >
                  Copy Password
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(lastCreatedCredentials.email, 'User email copied to clipboard.')}
                  className="px-3 py-2 rounded-md bg-surface-200 text-ink text-sm font-medium border border-edge"
                >
                  Copy Email
                </button>
                <button
                  type="button"
                  onClick={() => setLastCreatedCredentials(null)}
                  className="px-3 py-2 rounded-md bg-canvas text-ink text-sm font-medium border border-edge"
                >
                  Done
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <section>
        <header className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            Administration
          </p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Existing Users</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Browse, review status, and adjust role assignments for any account on the platform.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Left column — picker (mirrors AdminHistoryPage) */}
          <aside className="rounded-2xl border border-edge bg-surface p-3 shadow-sm">
            <div className="flex gap-1 rounded-lg bg-surface-200 p-1">
              {[
                { key: 'all',     label: 'All',      Icon: User },
                { key: 'student', label: 'Students', Icon: GraduationCap },
                { key: 'teacher', label: 'Teachers', Icon: UserCog },
                { key: 'admin',   label: 'Admins',   Icon: ShieldCheck },
              ].map(({ key, label, Icon }) => {
                const active = usersTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setUsersTab(key); setSelectedUserId(null); }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      active ? 'bg-surface text-ink shadow-sm' : 'text-ink-secondary hover:text-ink'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="relative mt-3">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary"
                strokeWidth={2}
              />
              <input
                type="text"
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                placeholder="Search users…"
                className="w-full rounded-lg border border-edge bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-tertiary focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="mt-3 max-h-[65vh] overflow-y-auto pr-1">
              {filteredPickerUsers.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-ink-tertiary">
                  No users match the current filters.
                </p>
              ) : (
                <ul className="space-y-1">
                  {filteredPickerUsers.map((u) => {
                    const active = selectedUserId === u.id;
                    const avatarUrl = resolveMediaUrl(u.photo);
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(u.id)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                            active ? 'bg-brand/10 text-ink ring-1 ring-brand/30' : 'hover:bg-surface-200'
                          }`}
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={`${u.prenom || ''} ${u.nom || ''}`.trim() || 'User'}
                              className="h-8 w-8 shrink-0 rounded-full object-cover border border-edge"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = '/Logo.png';
                              }}
                            />
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-200 text-xs font-semibold text-ink-secondary">
                              {getInitials(u.prenom, u.nom)}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">
                              {(u.prenom || '') + ' ' + (u.nom || '')}
                            </span>
                            <span className="block truncate text-xs text-ink-tertiary">
                              {u.email}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* Right column — user detail / editor */}
          <section className="min-w-0 rounded-2xl border border-edge bg-surface shadow-sm">
            {!selectedUser ? (
              <div className="flex h-full min-h-[50vh] items-center justify-center p-10 text-center">
                <div>
                  <p className="text-sm font-medium text-ink">Select a user</p>
                  <p className="mt-1 text-xs text-ink-tertiary">
                    Pick a user from the list to review and manage their account.
                  </p>
                </div>
              </div>
            ) : (
              (() => {
                const u = selectedUser;
                const avatarUrl = resolveMediaUrl(u.photo);
                return (
                <div className="rounded-2xl border border-edge bg-canvas p-5 shadow-sm transition hover:border-edge-strong">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${u.prenom || ''} ${u.nom || ''}`.trim() || 'User'}
                        className="h-12 w-12 shrink-0 rounded-2xl object-cover border border-edge"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = '/Logo.png';
                        }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-sm font-bold text-brand">
                        {getInitials(u.prenom, u.nom)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-ink">{u.prenom} {u.nom}</p>
                      <p className="truncate text-sm text-ink-secondary">{u.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          u.status === 'active'
                            ? 'bg-success/10 text-success'
                            : u.status === 'suspended'
                              ? 'bg-danger/10 text-danger'
                              : 'bg-surface text-ink-secondary'
                        }`}>
                          {u.status || 'unknown'}
                        </span>
                        <span className="text-xs text-ink-tertiary">
                          Last login: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {(u.roles || []).map((r) => (
                      <span key={`${u.id}-${r}`} className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand">
                        {roleLabel(r)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl border border-edge bg-surface px-4 py-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-tertiary">Phone</p>
                    <p className="mt-1 text-sm font-medium text-ink">{u.telephone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-tertiary">Created</p>
                    <p className="mt-1 text-sm font-medium text-ink">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-edge bg-surface px-4 py-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">Account Status</p>
                    <span className="text-xs text-ink-tertiary">Change access availability</span>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <select
                      value={editingStatusByUserId[u.id] || u.status || 'active'}
                      onChange={(event) => setEditingStatusByUserId((prev) => ({ ...prev, [u.id]: event.target.value }))}
                      className="rounded-xl border border-edge bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="suspended">suspended</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => saveUserStatus(u.id)}
                      disabled={!!savingByUserId[u.id]}
                      className="rounded-xl border border-edge bg-surface-200 px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface disabled:opacity-60"
                    >
                      {savingByUserId[u.id] ? 'Saving...' : 'Save Status'}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">Edit Roles</p>
                    <span className="text-xs text-ink-tertiary">{(editingRolesByUserId[u.id] || []).length} selected</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {roles
                    .filter((role) => {
                      const track = detectUserTrack(editingRolesByUserId[u.id] || u.roles || []);
                      return track === 'student'
                        ? STUDENT_TRACK_ROLE_NAMES.includes(role.nom)
                        : !STUDENT_TRACK_ROLE_NAMES.includes(role.nom);
                    })
                    .map((role) => {
                      const checked = (editingRolesByUserId[u.id] || []).includes(role.nom);
                      return (
                        <label
                          key={`${u.id}-${role.id}`}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                            checked
                              ? 'border-brand bg-brand-light/70 text-ink'
                              : 'border-edge bg-surface text-ink-secondary hover:border-edge-strong hover:text-ink'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="accent-brand"
                            checked={checked}
                            onChange={() => toggleUserRole(u.id, role.nom)}
                          />
                          <span>{roleLabel(role.nom)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-edge-subtle pt-4">
                  <p className="text-xs text-ink-tertiary">Changes apply immediately after saving.</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetUserPassword(u)}
                      disabled={!!savingByUserId[u.id]}
                      className="rounded-xl border border-edge bg-canvas px-4 py-2 text-sm font-medium text-ink transition hover:border-edge-strong hover:text-brand disabled:opacity-60"
                    >
                      {savingByUserId[u.id] ? 'Processing...' : 'Reset Temp Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => saveUserRoles(u.id)}
                      disabled={!!savingByUserId[u.id]}
                      className="rounded-xl border border-edge bg-surface-200 px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface disabled:opacity-60"
                    >
                      {savingByUserId[u.id] ? 'Saving...' : 'Save Roles'}
                    </button>
                  </div>
                </div>
                </div>
                );
              })()
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
