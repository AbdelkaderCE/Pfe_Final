/*
  Intent: Administrative nerve-center for disciplinary oversight.
          Merges case management with conseil disciplinaire meeting workflow.
          Confidential by nature — the interface whispers, never shouts.
  Access: Teacher / Admin only. Students see StudentDisciplinaryView instead.
  Palette: canvas base, surface cards. Semantic colors for status only.
  Depth: shadow-card + border-edge on cards. No stacked shadows.
  Typography: Inter. Section headings = text-base font-semibold. Body = text-sm.
  Spacing: 4px base. Cards p-6. gap-6 between sections.
*/

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CaseDetailPage from './CaseDetailPage';
import StudentDisciplinaryView from './StudentDisciplinaryView';
import request from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/* ── Inline SVG Icons (stroke 1.5) ─────────────────────────── */

const icons = {
  folder: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
    </svg>
  ),
  clock: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  calendar: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  ),
  check: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  plus: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  search: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  ),
  lock: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  alert: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
  users: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  scale: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97Z" />
    </svg>
  ),
  arrowLeft: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  ),
  archive: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  ),
  download: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  x: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  ),
  save: (p) => (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" />
    </svg>
  ),
};

/* ── Mock Data — Cases ──────────────────────────────────────── */
/* Data fetched from API — see component useEffect */

/* ── Mock Data — Meetings ───────────────────────────────────── */
/* Data fetched from API — see component useEffect */

const STAFF_MEMBERS_DEFAULT = [
  { name: 'Prof. Hamidi', id: 1 },
  { name: 'Prof. Kaci', id: 2 },
  { name: 'Prof. Belkacem', id: 3 },
  { name: 'Dr. Merniz', id: 4 },
  { name: 'Prof. Saadi', id: 5 },
  { name: 'Dr. Amrani', id: 6 },
];

let html2pdfLoader = null;
let exportLogoBase64Loader = null;

const EXPORT_LOGO_PATHS = [
  '/Logo.png',
  '/logo512.png',
  '/logo192.png',
  '/favicon.svg',
  '/favicon.ico',
];

const getHtml2Pdf = async () => {
  if (!html2pdfLoader) {
    html2pdfLoader = import('html2pdf.js/dist/html2pdf.bundle.min.js').then((module) => module.default || module);
  }

  return html2pdfLoader;
};

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
  reader.onerror = () => reject(new Error('Failed to read logo file.'));
  reader.readAsDataURL(blob);
});

const getExportLogoBase64 = async () => {
  if (!exportLogoBase64Loader) {
    exportLogoBase64Loader = (async () => {
      for (const path of EXPORT_LOGO_PATHS) {
        try {
          const response = await fetch(path);
          if (!response.ok) continue;
          const blob = await response.blob();
          const base64 = await blobToDataUrl(blob);
          if (base64) return base64;
        } catch (error) {
          // Try next fallback logo path.
        }
      }

      return '';
    })();
  }

  return exportLogoBase64Loader;
};

const waitForNodeImages = async (container) => {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return;

  await Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth > 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const finalize = () => {
        img.removeEventListener('load', finalize);
        img.removeEventListener('error', finalize);
        resolve();
      };

      img.addEventListener('load', finalize, { once: true });
      img.addEventListener('error', finalize, { once: true });
      setTimeout(finalize, 4000);
    });
  }));
};

/* ── Status Configs ─────────────────────────────────────────── */

const CASE_STATUS_CONFIG = {
  pending:    { label: 'Pending Investigation', bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', dot: 'bg-warning' },
  hearing:    { label: 'En instruction', bg: 'bg-brand-light', text: 'text-brand', border: 'border-edge-strong', dot: 'bg-brand' },
  sanctioned: { label: 'Sanction Applied', bg: 'bg-danger/10', text: 'text-danger', border: 'border-edge-strong', dot: 'bg-danger' },
  closed:     { label: 'Case Closed', bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', dot: 'bg-success' },
};

const MEETING_STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', bg: 'bg-brand-light', text: 'text-brand', border: 'border-edge-strong', dot: 'bg-brand' },
  finalized: { label: 'Finalized', bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', dot: 'bg-success' },
};

const VIOLATION_TYPES = ['All', 'Plagiarism', 'Exam Fraud', 'Misconduct'];
const MAX_ADDITIONAL_MEMBER_COUNT = 3;

/* ── Helpers ────────────────────────────────────────────────── */

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateLong(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function toDateInputValue(value) {
  const date = toValidDate(value);
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toTimeInputValue(value) {
  if (!value) return '';

  const raw = String(value).trim();
  const directMatch = raw.match(/^(\d{1,2}):(\d{2})/);
  if (directMatch) {
    const hours = String(Number(directMatch[1])).padStart(2, '0');
    const minutes = String(Number(directMatch[2])).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const date = toValidDate(value);
  if (!date) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function daysSince(dateStr) {
  return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toValidDate(value) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatFrDate(value) {
  const date = toValidDate(value);
  if (!date) return '--';

  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function buildMeetingFormHtml({
  title,
  meetingDate,
  meetingTime,
  meetingLocation,
  agenda,
  studentRows,
  memberRows,
  logoBase64,
}) {
  const dateLabel = (toValidDate(meetingDate) || new Date()).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const renderedStudents = studentRows
    .map((row, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.caseId)}</td>
          <td>${escapeHtml(row.studentName)}</td>
          <td>${escapeHtml(row.studentId)}</td>
          <td>${escapeHtml(row.violationType)}</td>
          <td>${escapeHtml(formatFrDate(row.caseDate))}</td>
        </tr>
      `;
    })
    .join('');

  const renderedMembers = memberRows
    .map((row, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.role)}</td>
        </tr>
      `;
    })
    .join('');

  const logoHtml = logoBase64
    ? `<div style="text-align: center; margin: 20px 0;">
        <img src="${logoBase64}" style="max-width: 120px; max-height: 120px; width: auto; height: auto;" />
       </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Fiche Conseil Disciplinaire</title>
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
            vertical-align: middle;
          }

          .agenda-box {
            border: 1px solid #000000;
            min-height: 80px;
            padding: 10px;
            line-height: 1.5;
            margin-top: 10px;
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
              FICHE DU CONSEIL DISCIPLINAIRE
            </div>

            <div class="rule"></div>

            <div class="date-info">
              Date : ${escapeHtml(dateLabel)}
            </div>
          </div>

          <div class="subtitle">Informations de la réunion</div>
          <table cellspacing="0" cellpadding="0">
            <thead>
              <tr>
                <th style="width: 5%;">N°</th>
                <th style="width: 22%;">Réunion</th>
                <th style="width: 18%;">Date</th>
                <th style="width: 14%;">Heure</th>
                <th style="width: 21%;">Lieu</th>
                <th style="width: 20%;">Président</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td>
                <td>${escapeHtml(title || 'Conseil disciplinaire')}</td>
                <td style="text-align: center;">${escapeHtml(formatFrDate(meetingDate))}</td>
                <td style="text-align: center;">${escapeHtml(meetingTime || '--:--')}</td>
                <td>${escapeHtml(meetingLocation || '-')}</td>
                <td>${escapeHtml(memberRows[0]?.name || '-')}</td>
              </tr>
            </tbody>
          </table>

          <div class="subtitle">Étudiants concernés</div>
          <table cellspacing="0" cellpadding="0">
            <thead>
              <tr>
                <th style="width:5%;">N°</th>
                <th style="width:13%;">Case ID</th>
                <th style="width:24%;">Nom et Prénom</th>
                <th style="width:16%;">Matricule</th>
                <th style="width:24%;">Infraction</th>
                <th style="width:18%;">Date du dossier</th>
              </tr>
            </thead>
            <tbody>
              ${renderedStudents || '<tr><td colspan="6" style="text-align: center;">Aucun dossier</td></tr>'}
            </tbody>
          </table>

          <div class="subtitle">Membres du conseil</div>
          <table cellspacing="0" cellpadding="0">
            <thead>
              <tr>
                <th style="width:8%;">N°</th>
                <th style="width:62%;">Nom et Prénom</th>
                <th style="width:30%;">Rôle</th>
              </tr>
            </thead>
            <tbody>
              ${renderedMembers || '<tr><td colspan="3" style="text-align: center;">Aucun membre</td></tr>'}
            </tbody>
          </table>

          <div class="subtitle">Objet / Motif</div>
          <div class="agenda-box">${escapeHtml(agenda || 'Réunion disciplinaire pour étude des dossiers signalés.')}</div>

          <div class="footer">
            <table class="signatures-table">
              <tr>
                <td style="width: 50%; text-align: center;">
                  Signature du Président<br/>
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
}

async function downloadMeetingFormPdf({
  title,
  meetingDate,
  meetingTime,
  meetingLocation,
  agenda,
  studentRows,
  memberRows,
}) {
  const [html2pdf, logoBase64] = await Promise.all([
    getHtml2Pdf(),
    getExportLogoBase64(),
  ]);

  const html = buildMeetingFormHtml({
    title,
    meetingDate,
    meetingTime,
    meetingLocation,
    agenda,
    studentRows,
    memberRows,
    logoBase64,
  });

  const parsedHtml = new DOMParser().parseFromString(html, 'text/html');
  const mountNode = document.createElement('div');
  mountNode.style.position = 'fixed';
  mountNode.style.left = '0';
  mountNode.style.top = '0';
  mountNode.style.width = '210mm';
  mountNode.style.opacity = '0';
  mountNode.style.pointerEvents = 'none';
  mountNode.style.zIndex = '-1';
  mountNode.innerHTML = `${parsedHtml.head.innerHTML}${parsedHtml.body.innerHTML}`;

  document.body.appendChild(mountNode);

  try {
    await waitForNodeImages(mountNode);

    const usableDate = toValidDate(meetingDate) || new Date();
    const fileDate = usableDate.toISOString().slice(0, 10);

    await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: `fiche_conseil_disciplinaire_${fileDate}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          letterRendering: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(mountNode)
      .save();
  } catch (error) {
    // Fallback: keep an official printable document when canvas export fails.
    const usableDate = toValidDate(meetingDate) || new Date();
    const fileDate = usableDate.toISOString().slice(0, 10);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      let printed = false;
      const triggerPrint = () => {
        if (printed) return;
        printed = true;
        printWindow.focus();
        printWindow.print();
      };

      printWindow.addEventListener('load', triggerPrint, { once: true });
      setTimeout(triggerPrint, 800);
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = `fiche_conseil_disciplinaire_${fileDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    throw new Error('PDF generation failed in this browser session. An HTML file was downloaded: open it and print to PDF.');
  } finally {
    document.body.removeChild(mountNode);
  }
}

function normalizeCase(rawCase) {
  if (!rawCase) return null;

  const statusMap = {
    signale: 'pending',
    en_instruction: 'hearing',
    jugement: 'hearing',
    traite: 'closed',
  };

  const etudiant = rawCase.etudiant || {};
  const user = etudiant.user || {};
  const caseId = rawCase.id;
  const normalizedId = typeof caseId === 'string' && caseId.startsWith('CASE-')
    ? caseId
    : `CASE-${caseId}`;
  const dateSignal = rawCase.dateSignal || rawCase.dateReported || rawCase.createdAt || new Date().toISOString();
  const description = rawCase.descriptionSignal_ar || rawCase.descriptionSignal_en || rawCase.descriptionSignal || rawCase.description || '';
  const infractionLabel = rawCase.infraction?.nom_en || rawCase.infraction?.nom_ar || rawCase.violationType || 'Misconduct';
  const graviteLabel = rawCase.infraction?.gravite
    ? rawCase.infraction.gravite === 'tres_grave'
      ? 'Très grave'
      : rawCase.infraction.gravite.charAt(0).toUpperCase() + rawCase.infraction.gravite.slice(1)
    : '';
  const infractionName = graviteLabel ? `${infractionLabel} (${graviteLabel})` : infractionLabel;
  const reporterName = rawCase.reporterName
    || [rawCase.enseignantSignalantR?.user?.prenom, rawCase.enseignantSignalantR?.user?.nom].filter(Boolean).join(' ').trim()
    || null;
  const reporterEnseignantId = Number(rawCase.reporterEnseignantId ?? rawCase.enseignantSignalant ?? rawCase.enseignantSignalantR?.id);

  return {
    ...rawCase,
    rawId: typeof caseId === 'number' ? caseId : undefined,
    studentEtudiantId: etudiant.id || rawCase.studentEtudiantId || null,
    studentUserId: user.id || rawCase.studentUserId || null,
    id: normalizedId,
    status: statusMap[rawCase.status] || rawCase.status || 'pending',
    studentName: rawCase.studentName || [user.prenom, user.nom].filter(Boolean).join(' ').trim() || 'Unknown student',
    studentId: rawCase.studentId || etudiant.matricule || '-',
    department: rawCase.department || '-',
    violationType: infractionName,
    description,
    reporterName,
    reporterEnseignantId: Number.isInteger(reporterEnseignantId) && reporterEnseignantId > 0 ? reporterEnseignantId : null,
    dateReported: dateSignal,
    dateOfIncident: rawCase.dateOfIncident || dateSignal,
    timeline: Array.isArray(rawCase.timeline) && rawCase.timeline.length > 0
      ? rawCase.timeline
      : [
          {
            event: 'Report Submitted',
            date: dateSignal,
            detail: description || `Case reported for ${infractionName}.`,
            by: reporterName || 'Teacher',
          },
        ],
    evidenceFiles: Array.isArray(rawCase.evidenceFiles) ? rawCase.evidenceFiles : [],
    decision: rawCase.decision
      ? {
          verdict: rawCase.decision.verdict || rawCase.decision.nom_en || rawCase.decision.nom_ar || rawCase.decision.nom || '',
          details: rawCase.remarqueDecision || rawCase.decision.details || rawCase.decision.description || '',
          date: rawCase.dateDecision || rawCase.updatedAt || rawCase.createdAt || new Date().toISOString(),
          issuedBy: 'Disciplinary council',
        }
      : rawCase.decision || null,
  };
}

function normalizeMeeting(rawMeeting) {
  if (!rawMeeting) return null;

  const meetingId = rawMeeting.id;
  const normalizedId = typeof meetingId === 'string' && meetingId.startsWith('MEET-')
    ? meetingId
    : `MEET-${meetingId}`;

  const rawConseilId = typeof meetingId === 'number'
    ? meetingId
    : Number(String(meetingId).replace('MEET-', ''));

  const memberEntries = Array.isArray(rawMeeting.membres)
    ? rawMeeting.membres
        .map((m) => {
          const enseignantId = Number(m.enseignant?.id ?? m.enseignantId);
          const name = [m.enseignant?.user?.prenom, m.enseignant?.user?.nom].filter(Boolean).join(' ').trim();
          const hasEnseignantId = Number.isInteger(enseignantId) && enseignantId > 0;

          return {
            id: Number.isInteger(Number(m.id)) ? Number(m.id) : null,
            enseignantId: hasEnseignantId ? enseignantId : null,
            role: m.role || 'membre',
            name: name || (hasEnseignantId ? `Teacher #${enseignantId}` : (m.role === 'rapporteur' ? 'Reporter' : 'Member')),
          };
        })
        .filter((member) => Boolean(member.name))
    : [];

  const participants = Array.isArray(rawMeeting.participants)
    ? rawMeeting.participants
    : memberEntries.map((member) => member.name).filter(Boolean);

  const caseIds = Array.isArray(rawMeeting.caseIds)
    ? rawMeeting.caseIds
    : Array.isArray(rawMeeting.dossiers)
      ? rawMeeting.dossiers.map((d) => `CASE-${d.id}`)
      : [];

  // Extract decision from the first dossier that has one (all should have same decision in a meeting)
  const decisionsInMeeting = Array.isArray(rawMeeting.dossiers)
    ? rawMeeting.dossiers
        .map((d) => d.decision)
        .filter(Boolean)
    : [];
  
  const firstDecision = decisionsInMeeting[0];
  const decisionText = firstDecision 
    ? (firstDecision.verdict || firstDecision.nom_en || firstDecision.nom_ar || '')
    : null;

  const presidentMember = memberEntries.find((m) => m.role === 'president') || null;
  const reporterMember = memberEntries.find((m) => m.role === 'rapporteur') || null;
  const presidentEnseignantId = presidentMember?.enseignantId ?? null;
  const membreIds = memberEntries.map(m => String(m.enseignantId)).filter(Boolean);

  return {
    ...rawMeeting,
    id: normalizedId,
    conseilId: Number.isFinite(rawConseilId) ? rawConseilId : null,
    title: rawMeeting.title || 'Conseil disciplinaire',
    agenda: rawMeeting.agenda || rawMeeting.description_en || rawMeeting.description_ar || '',
    date: rawMeeting.date || rawMeeting.dateReunion || new Date().toISOString(),
    time: rawMeeting.time || (rawMeeting.heure ? new Date(rawMeeting.heure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'),
    location: rawMeeting.location || rawMeeting.lieu || 'TBD',
    status: rawMeeting.status === 'planifie' ? 'scheduled' : rawMeeting.status === 'termine' ? 'finalized' : (rawMeeting.status || 'scheduled'),
    participants,
    memberEntries,
    membres: memberEntries,
    membreIds,
    caseIds,
    decision: decisionText,
    dossiers: Array.isArray(rawMeeting.dossiers) ? rawMeeting.dossiers : [],
    presidentEnseignantId,
    rapporteurEnseignantId: reporterMember?.enseignantId ?? null,
    reporterEnseignantId: reporterMember?.enseignantId ?? null,
  };
}

/* ── Shared Sub-components ──────────────────────────────────── */

function StatusBadge({ status, config }) {
  const cfg = config[status];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, icon, accent = 'brand' }) {
  const accents = {
    brand:   'bg-brand-light text-brand',
    warning: 'bg-warning/10 text-warning',
    danger:  'bg-danger/10 text-danger',
    success: 'bg-success/10 text-success',
  };
  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${accents[accent]} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-ink tracking-tight">{value}</p>
        <p className="text-xs text-ink-tertiary mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function Avatar({ name, size = 'w-8 h-8 text-xs' }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className={`${size} rounded-full bg-brand-light flex items-center justify-center shrink-0`}>
      <span className="font-bold text-brand">{initials}</span>
    </div>
  );
}

function TeacherQuickReport({
  students,
  infractions,
  form,
  onChange,
  onSubmit,
  submitting,
  error,
  success,
}) {
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredStudents = students.filter(s => {
    const query = searchInput.toLowerCase().trim();
    if (!query) return false;
    return (
      s.fullName.toLowerCase().includes(query) ||
      (s.matricule && s.matricule.toLowerCase().includes(query))
    );
  });

  const selectedStudent = students.find(s => String(s.id) === form.studentId);

  const handleSelectStudent = (studentId, studentName) => {
    onChange('studentId', String(studentId));
    setSearchInput(studentName);
    setShowDropdown(false);
  };

  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-ink">Teacher Report</h2>
          <p className="text-sm text-ink-tertiary mt-1">Search for a student and write the reason to open a disciplinary case.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-1 relative">
          <label className="block text-xs font-medium text-ink-secondary mb-1">Student</label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search by name or ID..."
            className="w-full px-3 py-2 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-control-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStudent(s.id, s.fullName)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-200 transition-colors border-b border-edge-subtle last:border-b-0"
                  >
                    <p className="font-medium text-ink">{s.fullName}</p>
                    <p className="text-xs text-ink-tertiary">
                      {s.matricule && `ID: ${s.matricule}`}
                      {s.matricule && s.promo?.nom ? ' · ' : ''}
                      {s.promo?.nom || ''}
                    </p>
                  </button>
                ))
              ) : searchInput.trim() ? (
                <div className="px-3 py-3 text-sm text-ink-muted text-center">
                  No students found
                </div>
              ) : (
                <div className="px-3 py-3 text-sm text-ink-muted text-center">
                  Start typing to search...
                </div>
              )}
            </div>
          )}
          {form.studentId && !searchInput && (
            <p className="text-xs text-success mt-1">✓ {selectedStudent?.fullName} selected</p>
          )}
        </div>

        <div className="md:col-span-1">
          <label className="block text-xs font-medium text-ink-secondary mb-1">Infraction Level</label>
          <select
            value={form.typeInfraction}
            onChange={(e) => onChange('typeInfraction', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
            required
          >
            <option value="">Select infraction level...</option>
            {infractions.length > 0 ? (
              infractions.map((infraction) => {
                const label = `${infraction.nom_en || infraction.nom_ar} (${infraction.gravite === 'tres_grave' ? 'Très grave' : infraction.gravite})`;
                return (
                  <option key={infraction.id} value={infraction.id}>
                    {label}
                  </option>
                );
              })
            ) : (
              <> 
                <option value="faible">Faible</option>
                <option value="moyenne">Moyenne</option>
                <option value="grave">Grave</option>
                <option value="tres_grave">Très grave</option>
              </>
            )}
          </select>
        </div>

        <div className="md:col-span-1">
          <label className="block text-xs font-medium text-ink-secondary mb-1">Details</label>
          <textarea
            value={form.reason}
            onChange={(e) => onChange('reason', e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full px-3 py-2 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand"
            placeholder="Describe what happened..."
          />
        </div>

        <div className="md:col-span-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            {error && <p className="text-xs text-danger">{error}</p>}
            {success && <p className="text-xs text-success">{success}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting || !form.studentId}
            className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Create Case'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Tab Definitions ────────────────────────────────────────── */

const ADMIN_TABS = [
  { id: 'cases',       label: 'Cases',       Icon: icons.folder },
  { id: 'meetings',    label: 'Meetings',    Icon: icons.calendar },
  { id: 'new-meeting', label: 'New Meeting', Icon: icons.plus },
];

const TEACHER_TABS = [
  { id: 'cases', label: 'My Reports', Icon: icons.folder },
  { id: 'meetings', label: 'My Meetings', Icon: icons.calendar },
];

const PRESIDENT_TABS = [
  { id: 'meetings', label: 'Decision Meetings', Icon: icons.calendar },
  { id: 'my-meetings', label: 'My Meetings', Icon: icons.calendar },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function DisciplinaryCasesPage({ role = 'teacher' }) {
  const { user } = useAuth();
  const normalizedRole = String(role || 'teacher').toLowerCase();
  const isAdminView = normalizedRole === 'admin';
  const isPresidentView = normalizedRole === 'president';
  const canTeacherReport = normalizedRole === 'teacher';
  const canViewMeetings = isAdminView || isPresidentView || canTeacherReport;
  const canManageMeetings = isAdminView;
  const availableTabs = isAdminView
    ? ADMIN_TABS
    : isPresidentView
      ? PRESIDENT_TABS
      : TEACHER_TABS;

  /* Top-level nav */
  const [activeTab, setActiveTab] = useState('cases');
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [preselectedCases, setPreselectedCases] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  /* Cases filter state */
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  /* Meetings filter state */
  const [meetingFilterStatus, setMeetingFilterStatus] = useState('all');
  const [meetingSearch, setMeetingSearch] = useState('');

  /* Data from API */
  const [cases, setCases] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [infractions, setInfractions] = useState([]);
  const [disciplinaryDecisions, setDisciplinaryDecisions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportForm, setReportForm] = useState({ studentId: '', reason: '', typeInfraction: '' });

  const loadCases = async () => {
    if (isPresidentView) {
      const meetingsResponse = await request('/api/v1/disciplinary/meetings');
      const rawMeetings = Array.isArray(meetingsResponse?.data) ? meetingsResponse.data : [];
      setMeetings(rawMeetings.map(normalizeMeeting).filter(Boolean));

      const rawCasesFromMeetings = rawMeetings.flatMap((meeting) =>
        Array.isArray(meeting?.dossiers) ? meeting.dossiers : []
      );

      const dedupedCases = Array.from(
        new Map(rawCasesFromMeetings.map((item) => [item.id, item])).values()
      );

      setCases(dedupedCases.map(normalizeCase).filter(Boolean));
      return;
    }

    const response = await request('/api/v1/disciplinary/cases');
    const rawCases = Array.isArray(response?.data) ? response.data : [];
    setCases(rawCases.map(normalizeCase).filter(Boolean));
  };

  const loadMeetings = async () => {
    if (!canViewMeetings) {
      setMeetings([]);
      return;
    }

    const response = await request('/api/v1/disciplinary/meetings');
    const rawMeetings = Array.isArray(response?.data) ? response.data : [];
    setMeetings(rawMeetings.map(normalizeMeeting).filter(Boolean));
  };

  useEffect(() => {
    (async () => {
      try {
        if (isAdminView) {
          const [cRes, mRes, sRes, stRes, iRes, dRes] = await Promise.allSettled([
            request('/api/v1/disciplinary/cases'),
            request('/api/v1/disciplinary/meetings'),
            request('/api/v1/disciplinary/students'),
            request('/api/v1/disciplinary/staff'),
            request('/api/v1/disciplinary/infractions'),
            request('/api/v1/disciplinary/decisions'),
          ]);

          if (cRes.status === 'fulfilled') {
            const rawCases = Array.isArray(cRes.value?.data) ? cRes.value.data : [];
            setCases(rawCases.map(normalizeCase).filter(Boolean));
          }

          if (mRes.status === 'fulfilled') {
            const rawMeetings = Array.isArray(mRes.value?.data) ? mRes.value.data : [];
            setMeetings(rawMeetings.map(normalizeMeeting).filter(Boolean));
          }

          if (sRes.status === 'fulfilled') {
            setStudents(Array.isArray(sRes.value?.data) ? sRes.value.data : []);
          }

          if (stRes.status === 'fulfilled') {
            const staffData = Array.isArray(stRes.value?.data) ? stRes.value.data : [];
            setStaff(staffData);
          } else {
            setStaff([]);
          }

          if (iRes.status === 'fulfilled') {
            setInfractions(Array.isArray(iRes.value?.data) ? iRes.value.data : []);
          } else {
            setInfractions([]);
          }

          if (dRes.status === 'fulfilled') {
            setDisciplinaryDecisions(Array.isArray(dRes.value?.data) ? dRes.value.data : []);
          } else {
            setDisciplinaryDecisions([]);
          }
        } else if (isPresidentView) {
          const [mRes, iRes, dRes] = await Promise.allSettled([
            request('/api/v1/disciplinary/meetings'),
            request('/api/v1/disciplinary/infractions'),
            request('/api/v1/disciplinary/decisions'),
          ]);

          if (mRes.status === 'fulfilled') {
            const rawMeetings = Array.isArray(mRes.value?.data) ? mRes.value.data : [];
            setMeetings(rawMeetings.map(normalizeMeeting).filter(Boolean));

            const rawCasesFromMeetings = rawMeetings.flatMap((meeting) =>
              Array.isArray(meeting?.dossiers) ? meeting.dossiers : []
            );

            const dedupedCases = Array.from(
              new Map(rawCasesFromMeetings.map((item) => [item.id, item])).values()
            );

            setCases(dedupedCases.map(normalizeCase).filter(Boolean));
          }

          if (iRes.status === 'fulfilled') {
            setInfractions(Array.isArray(iRes.value?.data) ? iRes.value.data : []);
          } else {
            setInfractions([]);
          }

          if (dRes.status === 'fulfilled') {
            setDisciplinaryDecisions(Array.isArray(dRes.value?.data) ? dRes.value.data : []);
          } else {
            setDisciplinaryDecisions([]);
          }

          setStudents([]);
          setStaff([]);
        } else {
          const [cRes, sRes, mRes, iRes, dRes] = await Promise.allSettled([
            request('/api/v1/disciplinary/cases'),
            request('/api/v1/disciplinary/students'),
            request('/api/v1/disciplinary/meetings'),
            request('/api/v1/disciplinary/infractions'),
            request('/api/v1/disciplinary/decisions'),
          ]);

          if (cRes.status === 'fulfilled') {
            const rawCases = Array.isArray(cRes.value?.data) ? cRes.value.data : [];
            setCases(rawCases.map(normalizeCase).filter(Boolean));
          }

          if (sRes.status === 'fulfilled') {
            setStudents(Array.isArray(sRes.value?.data) ? sRes.value.data : []);
          }

          if (mRes.status === 'fulfilled') {
            const rawMeetings = Array.isArray(mRes.value?.data) ? mRes.value.data : [];
            setMeetings(rawMeetings.map(normalizeMeeting).filter(Boolean));
          } else {
            setMeetings([]);
          }

          if (iRes.status === 'fulfilled') {
            setInfractions(Array.isArray(iRes.value?.data) ? iRes.value.data : []);
          } else {
            setInfractions([]);
          }

          if (dRes.status === 'fulfilled') {
            setDisciplinaryDecisions(Array.isArray(dRes.value?.data) ? dRes.value.data : []);
          } else {
            setDisciplinaryDecisions([]);
          }

          setStaff([]);
        }
      } catch {
        /* endpoints may not exist yet */
        setMeetings([]);
        setStaff([]);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [isAdminView, isPresidentView]);

  useEffect(() => {
    if (availableTabs.some((tab) => tab.id === activeTab)) {
      return;
    }

    setPreselectedCases([]);
    setActiveTab(availableTabs[0]?.id || 'cases');
  }, [activeTab, availableTabs]);

  const updateReportForm = (field, value) => {
    setReportForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTeacherReportSubmit = async (event) => {
    event.preventDefault();
    setReportError('');
    setReportSuccess('');

    const studentId = Number(reportForm.studentId);
    const reason = reportForm.reason.trim();
    const typeInfraction = reportForm.typeInfraction.trim();

    if (!studentId || !typeInfraction) {
      setReportError('Please fill in all required fields.');
      return;
    }

    try {
      setReportSubmitting(true);
      const payload = {
        studentId,
        reason,
        titre: 'Teacher disciplinary report',
      };

      const selectedInfractionId = Number(typeInfraction);
      if (Number.isInteger(selectedInfractionId) && selectedInfractionId > 0) {
        payload.infractionId = selectedInfractionId;
      } else {
        payload.typeInfraction = typeInfraction;
      }

      await request('/api/v1/disciplinary/cases', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await loadCases();
      setReportForm({ studentId: '', reason: '', typeInfraction: '' });
      setReportSuccess('Case created successfully.');
      setActiveTab('cases');
    } catch (error) {
      setReportError(error?.message || 'Failed to create case.');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Students see their own view
  if (normalizedRole === 'student') return <StudentDisciplinaryView />;

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-edge-strong border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  /* Derived data */
  const filteredCases = cases.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterType !== 'All' && c.violationType) {
      // Check if violationType contains the filter value (case-insensitive)
      const violationLower = c.violationType.toLowerCase();
      const filterLower = filterType.toLowerCase();
      if (!violationLower.includes(filterLower)) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.studentName.toLowerCase().includes(q) || c.studentId.includes(q) || c.id.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: cases.length,
    pending: cases.filter(c => c.status === 'pending').length,
    hearing: cases.filter(c => c.status === 'hearing').length,
    resolved: cases.filter(c => c.status === 'sanctioned' || c.status === 'closed').length,
  };

  const filteredMeetings = meetings
    .filter(m => {
      const currentUserId = user?.enseignant?.id;
      
      // For teachers (reporters), show meetings where they are president OR members
      if (canTeacherReport && !isAdminView) {
        const isPresident = m.presidentEnseignantId === currentUserId;
        const isRapporteur = m.rapporteurEnseignantId === currentUserId;
        const isMember = Array.isArray(m.membres) && 
          m.membres.some(mem => mem.enseignantId === currentUserId);
        
        // Show if president, rapporteur, or member
        if (!isPresident && !isRapporteur && !isMember) return false;
      }
      
      // For presidents viewing "Decision Meetings" tab: only show their president meetings
      if (isPresidentView && activeTab === 'meetings') {
        if (m.presidentEnseignantId !== currentUserId) return false;
      }
      
      // For presidents viewing "My Meetings" tab: show meetings where they are members (not president)
      if (isPresidentView && activeTab === 'my-meetings') {
        const isPresident = m.presidentEnseignantId === currentUserId;
        const isRapporteur = m.rapporteurEnseignantId === currentUserId;
        
        // Check if user is in the membres array
        const isMember = Array.isArray(m.membres) && 
          m.membres.some(mem => mem.enseignantId === currentUserId);
        
        if (isPresident) return false; // Don't show their own meetings
        if (!isRapporteur && !isMember) return false; // Only show if member or rapporteur
      }
      
      if (meetingFilterStatus !== 'all' && m.status !== meetingFilterStatus) return false;
      if (meetingSearch) {
        const q = meetingSearch.toLowerCase();
        return m.id.toLowerCase().includes(q) ||
          m.caseIds.some(cid => {
            const cs = cases.find(c => c.id === cid);
            return cs && cs.studentName.toLowerCase().includes(q);
          });
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  /* Navigation */
  const goToNewMeeting = (caseIds = []) => {
    setPreselectedCases(caseIds);
    setActiveTab('new-meeting');
  };

  const handleDeleteCase = async (caseId) => {
    if (!window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) return;

    try {
      const numericId = Number(String(caseId).replace('CASE-', ''));
      await request(`/api/v1/disciplinary/cases/${numericId}`, {
        method: 'DELETE',
      });
      await loadCases();
    } catch (error) {
      window.alert(error?.message || 'Failed to delete case.');
    }
  };

  /* Detail views */
  if (selectedCase) {
    return (
      <CaseDetailPage
        caseData={selectedCase}
        canManageActions={canManageMeetings}
        canDeleteCase={isAdminView || canTeacherReport}
        onDeleteCase={handleDeleteCase}
        onCreateMeeting={(caseId) => {
          setSelectedCase(null);
          goToNewMeeting([caseId]);
        }}
        onBack={() => setSelectedCase(null)}
      />
    );
  }

  if (selectedMeeting) {
    // Determine if user is viewing in read-only mode (member of meeting they don't preside over)
    const isUserPresident = selectedMeeting.presidentEnseignantId === user?.enseignant?.id;
    const isUserMember = (selectedMeeting.membreIds || []).includes(String(user?.enseignant?.id));
    const isUserRapporteur = selectedMeeting.rapporteurEnseignantId === user?.enseignant?.id;
    const viewOnly = isPresidentView && !isUserPresident && (isUserMember || isUserRapporteur);

    return (
      <MeetingDetailView
        meeting={selectedMeeting}
        cases={cases}
        staff={staff}
        decisionChoices={disciplinaryDecisions}
        canManageMeeting={canManageMeetings && !viewOnly}
        viewOnly={viewOnly}
        currentEnseignantId={user?.enseignant?.id ?? null}
        onBack={() => setSelectedMeeting(null)}
        onMeetingUpdated={async (updatedMeeting) => {
          await Promise.all([loadMeetings(), loadCases()]);
          if (updatedMeeting) {
            setSelectedMeeting(updatedMeeting);
          }
        }}
        onMeetingDeleted={async () => {
          await Promise.all([loadMeetings(), loadCases()]);
          setSelectedMeeting(null);
          setActiveTab('meetings');
        }}
        onFinalized={async () => {
          await Promise.all([loadMeetings(), loadCases()]);
        }}
      />
    );
  }

  /* Main view */
  return (
    <div className="space-y-6 min-w-0">

      {/* Confidential banner */}
      <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
        {icons.lock({ className: 'w-5 h-5 text-warning shrink-0' })}
        <div>
          <p className="text-sm font-medium text-warning">Restricted Access — Confidential Records</p>
          <p className="mt-0.5 text-xs text-warning">
            This module contains sensitive disciplinary data. Access is logged and limited to authorized personnel only.
          </p>
        </div>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">
            {isAdminView
              ? 'Disciplinary Council'
              : isPresidentView
                ? 'President Decision Workspace'
                : 'Teacher Disciplinary Reports'}
          </h1>
          <p className="mt-1 text-sm text-ink-tertiary">
            {isAdminView
              ? 'Manage cases, schedule hearings, and record decisions.'
              : isPresidentView
                ? 'Review your assigned councils and validate disciplinary decisions.'
                : 'Submit reports and follow disciplinary case outcomes.'}
          </p>
        </div>
        {canManageMeetings && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="px-4 py-2.5 text-sm font-medium text-brand bg-brand/5 border border-edge-strong rounded-md hover:bg-brand/10 transition-all duration-150 flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-brand/30 focus:ring-offset-2"
            >
              {icons.users({ className: 'w-4 h-4' })}
              Add Members
            </button>
            <button
              onClick={() => goToNewMeeting()}
              className="px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-brand/30 focus:ring-offset-2"
            >
              {icons.plus({ className: 'w-4 h-4' })}
              New Meeting
            </button>
          </div>
        )}
      </div>

      {canTeacherReport && (
        <TeacherQuickReport
          students={students}
          infractions={infractions}
          form={reportForm}
          onChange={updateReportForm}
          onSubmit={handleTeacherReportSubmit}
          submitting={reportSubmitting}
          error={reportError}
          success={reportSuccess}
        />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Cases" value={stats.total} accent="brand" icon={icons.folder({ className: 'w-5 h-5' })} />
        <StatCard label="Pending Investigation" value={stats.pending} accent="warning" icon={icons.clock({ className: 'w-5 h-5' })} />
        <StatCard label="En instruction" value={stats.hearing} accent="brand" icon={icons.calendar({ className: 'w-5 h-5' })} />
        <StatCard label="Resolved" value={stats.resolved} accent="success" icon={icons.check({ className: 'w-5 h-5' })} />
      </div>

      {/* Tab navigation */}
      <div className="bg-surface-200 dark:bg-surface-300/30 rounded-md p-1 inline-flex">
        {availableTabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all duration-150 flex items-center gap-2 focus:ring-2 focus:ring-brand/30 ${
              activeTab === id
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-300/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'cases' && (
        <CasesTab
          cases={filteredCases}
          allCases={cases}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterType={filterType}
          setFilterType={setFilterType}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          canScheduleMeetings={canManageMeetings}
          onSelectCase={setSelectedCase}
          onConvoke={goToNewMeeting}
          onDeleteCase={handleDeleteCase}
          canDeleteCases={isAdminView || canTeacherReport}
          user={user}
          infractions={infractions}
        />
      )}

      {(activeTab === 'meetings' || activeTab === 'my-meetings') && (
        <MeetingsTab
          meetings={filteredMeetings}
          cases={cases}
          filterStatus={meetingFilterStatus}
          setFilterStatus={setMeetingFilterStatus}
          search={meetingSearch}
          setSearch={setMeetingSearch}
          onViewMeeting={setSelectedMeeting}
        />
      )}

      {canManageMeetings && activeTab === 'new-meeting' && (
        <NewMeetingTab
          cases={cases}
          staff={staff}
          preselected={preselectedCases}
          onSave={async () => {
            setPreselectedCases([]);
            await Promise.all([loadMeetings(), loadCases()]);
            setActiveTab('meetings');
          }}
          onCancel={() => { setPreselectedCases([]); setActiveTab('cases'); }}
        />
      )}

      {canManageMeetings && showAddMemberModal && (
        <AddCouncilMemberModal
          meetings={meetings}
          staff={staff}
          onClose={() => setShowAddMemberModal(false)}
          onAdded={async () => {
            setShowAddMemberModal(false);
            await Promise.all([loadMeetings(), loadCases()]);
            setActiveTab('meetings');
          }}
        />
      )}
    </div>
  );
}


function AddCouncilMemberModal({ meetings = [], staff = [], onClose, onAdded }) {
  const teacherOptions = useMemo(() => {
    const seenTeacherIds = new Set();

    return (Array.isArray(staff) ? staff : [])
      .filter((member) => member && typeof member === 'object')
      .map((member) => {
          const parsedId = Number(member.id);
          const name = member.name || [member.prenom, member.nom].filter(Boolean).join(' ').trim();

          return {
            id: Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null,
            name,
            grade: member.grade || 'Teacher',
          };
      })
      .filter((teacher) => {
        if (!Number.isInteger(teacher.id) || teacher.id <= 0 || !teacher.name) return false;
        if (seenTeacherIds.has(teacher.id)) return false;
        seenTeacherIds.add(teacher.id);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [staff]);

  const availableConseils = useMemo(
    () => (Array.isArray(meetings) ? meetings : [])
      .filter((meeting) => Number.isInteger(Number(meeting?.conseilId)) && Number(meeting?.conseilId) > 0),
    [meetings]
  );

  const [selectedConseilId, setSelectedConseilId] = useState(
    availableConseils[0]?.conseilId ? String(availableConseils[0].conseilId) : ''
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedRole, setSelectedRole] = useState('membre');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teacherOptions;
    const q = searchQuery.toLowerCase();
    return teacherOptions.filter((teacher) =>
      teacher.name.toLowerCase().includes(q) || teacher.grade.toLowerCase().includes(q)
    );
  }, [teacherOptions, searchQuery]);

  useEffect(() => {
    if (availableConseils.length === 0) {
      setSelectedConseilId('');
      return;
    }

    if (availableConseils.some((meeting) => String(meeting.conseilId) === selectedConseilId)) {
      return;
    }

    setSelectedConseilId(String(availableConseils[0].conseilId));
  }, [availableConseils, selectedConseilId]);

  useEffect(() => {
    if (filteredTeachers.length === 0) {
      setSelectedTeacherId('');
      return;
    }

    if (filteredTeachers.some((teacher) => String(teacher.id) === selectedTeacherId)) {
      return;
    }

    setSelectedTeacherId(String(filteredTeachers[0].id));
  }, [filteredTeachers, selectedTeacherId]);

  const handleSubmit = async () => {
    const conseilId = Number(selectedConseilId);

    if (!Number.isInteger(conseilId) || conseilId <= 0 || !selectedTeacherId || submitting) {
      setError('Please choose a conseil ID and a teacher.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await request('/api/v1/disciplinary/membres-conseil', {
        method: 'POST',
        body: JSON.stringify({
          conseilId,
          enseignantId: Number(selectedTeacherId),
          role: selectedRole,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response || response.success === false) {
        throw new Error(response?.error?.message || 'Failed to add member.');
      }

      if (typeof onAdded === 'function') {
        await onAdded();
      }
    } catch (err) {
      setError(err?.message || 'Failed to add member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-lg border border-edge shadow-card p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-ink">Add Council Member</h3>
            <p className="mt-1 text-sm text-ink-tertiary">Choose a teacher and insert a new row into membres_conseil.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-200 transition-colors"
            aria-label="Close"
          >
            {icons.x({ className: 'w-4 h-4' })}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1">Conseil ID</label>
            <input
              type="number"
              min="1"
              value={selectedConseilId}
              onChange={(e) => setSelectedConseilId(e.target.value)}
              placeholder="Enter conseil ID"
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
            {availableConseils.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedConseilId(e.target.value);
                  }
                }}
                className="mt-2 w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
              >
                <option value="">Quick select from existing meetings...</option>
                {availableConseils.map((meeting) => (
                  <option key={`${meeting.id}-${meeting.conseilId}`} value={meeting.conseilId}>
                    {meeting.id} · {formatDate(meeting.date)} · {meeting.location}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1">Search Teacher</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or grade..."
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">Select Teacher</label>
            <div className="bg-control-bg border border-control-border rounded-md max-h-48 overflow-y-auto">
              {filteredTeachers.length > 0 ? (
                <div className="divide-y divide-edge-subtle">
                  {filteredTeachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      type="button"
                      onClick={() => setSelectedTeacherId(String(teacher.id))}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-surface-200 ${
                        String(selectedTeacherId) === String(teacher.id)
                          ? 'bg-brand/10 text-brand font-medium'
                          : 'text-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-xs text-ink-secondary">{teacher.grade}</p>
                        </div>
                        {String(selectedTeacherId) === String(teacher.id) && (
                          <span className="text-brand font-semibold">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-ink-muted">
                    {searchQuery.trim() ? 'No teachers found matching your search.' : 'No teachers available.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              <option value="membre">Member</option>
              <option value="president">President</option>
            </select>
            <p className="mt-2 text-xs text-ink-muted">
              Reporter is assigned automatically from the teacher who submitted the report.
            </p>
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger/5 border border-edge-strong rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || filteredTeachers.length === 0 || !selectedTeacherId}
              className="px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {icons.users({ className: 'w-4 h-4' })}
              {submitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   CASES TAB
   ═══════════════════════════════════════════════════════════════ */

function CasesTab({
  cases, allCases,
  filterStatus, setFilterStatus,
  filterType, setFilterType,
  searchQuery, setSearchQuery,
  canScheduleMeetings = false,
  onSelectCase, onConvoke, onDeleteCase,
  canDeleteCases = false,
  user,
  infractions = [],
}) {
  // Build infraction options from the infractions data
  const infractionOptions = useMemo(() => {
    const options = ['All'];
    if (Array.isArray(infractions) && infractions.length > 0) {
      infractions.forEach(inf => {
        const label = inf.nom_en || inf.nom_ar || `Infraction #${inf.id}`;
        if (!options.includes(label)) {
          options.push(label);
        }
      });
    }
    return options.length > 1 ? options : ['All', 'Plagiarism', 'Exam Fraud', 'Misconduct'];
  }, [infractions]);

  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card">

      {/* Filters bar */}
      <div className="px-6 py-4 border-b border-edge-subtle flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'hearing', label: 'En instruction' },
            { key: 'sanctioned', label: 'Sanctioned' },
            { key: 'closed', label: 'Closed' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-100 focus:ring-2 focus:ring-brand/30 ${
                filterStatus === f.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-ink-secondary bg-surface-200 dark:bg-surface-300/30 hover:bg-surface-300 hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Type + search */}
        <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-sm bg-control-bg border border-control-border rounded-md text-ink-secondary focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
          >
            {infractionOptions.map(t => (
              <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
            ))}
          </select>

          <div className="relative flex-1 sm:flex-initial">
            {icons.search({ className: 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted' })}
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-edge-subtle">
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Case ID</th>
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider hidden md:table-cell">Violation</th>
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">Date</th>
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge-subtle">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  {icons.folder({ className: 'w-10 h-10 text-ink-muted mx-auto mb-3' })}
                  <p className="text-sm font-medium text-ink-secondary">No cases found</p>
                  <p className="text-xs text-ink-muted mt-1">Try adjusting your filters or search query.</p>
                </td>
              </tr>
            ) : (
              cases.map(c => {
                const pending = c.status === 'pending';
                const overdue = pending && daysSince(c.dateReported) > 14;

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-surface-200/50 dark:hover:bg-surface-300/20 transition-colors duration-100 cursor-pointer ${overdue ? 'bg-warning/5' : ''}`}
                    onClick={() => onSelectCase(c)}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {overdue && <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" title="Overdue" />}
                        <span className="font-mono text-xs font-medium text-ink">{c.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-ink">{c.studentName}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{c.studentId} · {c.department}</p>
                      {c.description && (
                        <p className="text-xs text-ink-tertiary mt-1 line-clamp-2">{c.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                      <span className="text-ink-secondary">{c.violationType}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={c.status} config={CASE_STATUS_CONFIG} />
                      {overdue && (
                        <p className="text-[10px] text-danger font-medium mt-1">
                          {daysSince(c.dateReported)} days pending
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3.5 hidden lg:table-cell">
                      <span className="text-ink-tertiary text-xs">{formatDate(c.dateOfIncident)}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canScheduleMeetings && (
                          <button
                            onClick={e => { e.stopPropagation(); onConvoke([c.id]); }}
                            className="px-2.5 py-1 text-xs font-medium text-ink-secondary bg-surface-200 dark:bg-surface-300/30 border border-edge rounded-md hover:bg-surface-300 transition-colors duration-100 focus:ring-2 focus:ring-brand/30"
                            title="Schedule meeting"
                          >
                            {icons.scale({ className: 'w-3.5 h-3.5' })}
                          </button>
                        )}
                        {canDeleteCases && c.status === 'pending' && (
                          <button
                            onClick={e => { e.stopPropagation(); onDeleteCase(c.id); }}
                            className="px-2.5 py-1 text-xs font-medium text-danger bg-danger/5 border border-danger/30 rounded-md hover:bg-danger/10 transition-colors duration-100 focus:ring-2 focus:ring-danger/30"
                            title="Delete case"
                          >
                            {icons.x({ className: 'w-3.5 h-3.5' })}
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); onSelectCase(c); }}
                          className="px-3 py-1 text-xs font-medium text-brand bg-brand/5 border border-edge-strong rounded-md hover:bg-brand/10 transition-colors duration-100 focus:ring-2 focus:ring-brand/30"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-edge-subtle flex items-center justify-between">
        <p className="text-xs text-ink-muted">Showing {cases.length} of {allCases.length} cases</p>
        <div className="flex items-center gap-1">
          <button className="px-2.5 py-1 text-xs font-medium text-ink-tertiary bg-surface-200 dark:bg-surface-300/30 rounded hover:bg-surface-300 transition-colors focus:ring-2 focus:ring-brand/30">Prev</button>
          <button className="px-2.5 py-1 text-xs font-medium text-white bg-brand rounded shadow-sm">1</button>
          <button className="px-2.5 py-1 text-xs font-medium text-ink-tertiary bg-surface-200 dark:bg-surface-300/30 rounded hover:bg-surface-300 transition-colors focus:ring-2 focus:ring-brand/30">Next</button>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MEETINGS TAB
   ═══════════════════════════════════════════════════════════════ */

function MeetingsTab({ meetings, cases, filterStatus, setFilterStatus, search, setSearch, onViewMeeting }) {
  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card">

      {/* Filters */}
      <div className="px-6 py-4 border-b border-edge-subtle flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'All Meetings' },
            { key: 'scheduled', label: 'Scheduled' },
            { key: 'finalized', label: 'Finalized' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-100 focus:ring-2 focus:ring-brand/30 ${
                filterStatus === f.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-ink-secondary bg-surface-200 dark:bg-surface-300/30 hover:bg-surface-300 hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative sm:ml-auto">
          {icons.search({ className: 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted' })}
          <input
            type="text"
            placeholder="Search meetings..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-edge-subtle">
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider hidden md:table-cell">Participants</th>
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Related Cases</th>
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">Decision</th>
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge-subtle">
            {meetings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  {icons.archive({ className: 'w-10 h-10 text-ink-muted mx-auto mb-3' })}
                  <p className="text-sm font-medium text-ink-secondary">No meetings found</p>
                  <p className="text-xs text-ink-muted mt-1">Adjust your filters or schedule a new meeting.</p>
                </td>
              </tr>
            ) : (
              meetings.map(m => {
                // Extract dossiers directly from the meeting's dossiers array if available
                const caseDisplay = Array.isArray(m.dossiers) && m.dossiers.length > 0
                  ? m.dossiers.map(d => {
                      const studentName = [d.etudiant?.user?.prenom, d.etudiant?.user?.nom].filter(Boolean).join(' ').trim() || 'Unknown';
                      return studentName;
                    })
                  : m.caseIds.map(cid => {
                      const c = cases.find(c => c.id === cid || c.id === `CASE-${cid}` || `CASE-${c.id}` === cid);
                      return c?.studentName || 'Unknown';
                    }).filter(Boolean);
                
                return (
                  <tr
                    key={m.id}
                    className="hover:bg-surface-200/50 dark:hover:bg-surface-300/20 transition-colors duration-100 cursor-pointer"
                    onClick={() => onViewMeeting(m)}
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-ink text-sm">{formatDate(m.date)}</p>
                      <p className="text-xs text-ink-muted">{m.time} · {m.location}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs text-ink-secondary">{m.id}</span>
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                      <div className="flex items-center -space-x-1">
                        {m.participants.slice(0, 3).map(p => (
                          <Avatar key={p} name={p} size="w-6 h-6 text-[9px]" />
                        ))}
                        {m.participants.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-surface-300 flex items-center justify-center text-[9px] font-medium text-ink-tertiary">
                            +{m.participants.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        {caseDisplay.length > 0 ? (
                          caseDisplay.map((name, idx) => (
                            <span key={idx} className="text-xs text-ink-secondary">{name}</span>
                          ))
                        ) : (
                          <span className="text-xs text-ink-muted">--</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 hidden lg:table-cell max-w-[180px]">
                      {m.decision
                        ? <span className="text-xs text-ink truncate block">{m.decision}</span>
                        : <span className="text-xs text-ink-muted">--</span>
                      }
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={m.status} config={MEETING_STATUS_CONFIG} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); onViewMeeting(m); }}
                        className="px-3 py-1 text-xs font-medium text-brand bg-brand/5 border border-edge-strong rounded-md hover:bg-brand/10 transition-colors duration-100 focus:ring-2 focus:ring-brand/30"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   NEW MEETING TAB
   ═══════════════════════════════════════════════════════════════ */

function NewMeetingTab({ cases, staff = STAFF_MEMBERS_DEFAULT, preselected = [], onSave, onCancel }) {
  const staffMembers = useMemo(() => {
    const seenStaffIds = new Set();

    return (Array.isArray(staff) ? staff : [])
      .map((member, index) => {
        if (member && typeof member === 'object') {
          const fallbackId = index + 1;
          const parsedId = Number(member.id);
          const name = member.name || [member.prenom, member.nom].filter(Boolean).join(' ').trim();

          return {
            id: Number.isInteger(parsedId) && parsedId > 0 ? parsedId : fallbackId,
            name: name || `Staff #${fallbackId}`,
            grade: member.grade || 'Staff',
          };
        }

        return {
          id: index + 1,
          name: String(member || `Staff #${index + 1}`),
          grade: 'Staff',
        };
      })
      .filter((member) => {
        if (!Number.isInteger(member.id) || member.id <= 0 || !member.name) return false;
        if (seenStaffIds.has(member.id)) return false;
        seenStaffIds.add(member.id);
        return true;
      });
  }, [staff]);

  const [selectedCaseIds, setSelectedCaseIds] = useState(preselected);
  const [form, setForm] = useState({
    title: 'Conseil disciplinaire',
    date: '', time: '', location: '', agenda: '',
    presidentId: staffMembers[0]?.id || null,
    memberIds: [],
  });
  const [presidentSearch, setPresidentSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [presidentSearchResults, setPresidentSearchResults] = useState([]);
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [showPresidentResults, setShowPresidentResults] = useState(false);
  const [showMemberResults, setShowMemberResults] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const selectedCases = selectedCaseIds.map(id => cases.find(c => c.id === id)).filter(Boolean);
  const selectedReporters = Array.from(
    selectedCases.reduce((acc, c) => {
      const id = Number(c.reporterEnseignantId);
      const hasNumericId = Number.isInteger(id) && id > 0;
      const reporterFromCase = (c.reporterName || '').trim();
      const reporterFromStaff = hasNumericId
        ? (staffMembers.find((member) => Number(member.id) === id)?.name || '')
        : '';
      const name = reporterFromCase || reporterFromStaff || (hasNumericId ? `Teacher #${id}` : 'Reporter');
      const key = hasNumericId ? `id-${id}` : `name-${name.toLowerCase()}`;

      if (!acc.has(key)) {
        acc.set(key, {
          key,
          id: hasNumericId ? id : null,
          name,
        });
      }

      return acc;
    }, new Map()).values()
  );

  const primaryReporter = selectedReporters.length === 1 ? selectedReporters[0] : null;
  const selectedPresident = staffMembers.find((member) => member.id === Number(form.presidentId)) || null;
  const availableMemberChoicesCount = staffMembers.filter((member) => {
    const isPresident = Number(form.presidentId) === Number(member.id);
    const isReporter = primaryReporter?.id != null && Number(primaryReporter.id) === Number(member.id);
    return !isPresident && !isReporter;
  }).length;

  // Search staff by name or grade
  const handlePresidentSearch = async (query) => {
    setPresidentSearch(query);
    if (query.length < 2) {
      setPresidentSearchResults([]);
      setShowPresidentResults(false);
      return;
    }

    try {
      const response = await request(`/api/v1/disciplinary/staff/search?q=${encodeURIComponent(query)}`);
      if (response?.success && Array.isArray(response.data)) {
        setPresidentSearchResults(response.data);
        setShowPresidentResults(true);
      }
    } catch (error) {
      console.error('Failed to search staff:', error);
    }
  };

  const handleMemberSearch = async (query) => {
    setMemberSearch(query);
    if (query.length < 2) {
      setMemberSearchResults([]);
      setShowMemberResults(false);
      return;
    }

    try {
      const response = await request(`/api/v1/disciplinary/staff/search?q=${encodeURIComponent(query)}`);
      if (response?.success && Array.isArray(response.data)) {
        setMemberSearchResults(response.data);
        setShowMemberResults(true);
      }
    } catch (error) {
      console.error('Failed to search staff:', error);
    }
  };

  useEffect(() => {
    if (staffMembers.length === 0) return;

    setForm((prev) => {
      const currentPresidentId = Number(prev.presidentId);
      const isValidPresident = staffMembers.some((member) => member.id === currentPresidentId);
      const nextPresidentId = isValidPresident ? currentPresidentId : staffMembers[0].id;
      const validMemberIds = prev.memberIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
        .filter((id) => staffMembers.some((member) => member.id === id))
        .filter((id) => id !== nextPresidentId)
        .slice(0, MAX_ADDITIONAL_MEMBER_COUNT);

      return {
        ...prev,
        presidentId: nextPresidentId,
        memberIds: validMemberIds,
      };
    });
  }, [staffMembers]);

  const removeCaseId = (id) => setSelectedCaseIds(prev => prev.filter(x => x !== id));
  const addCaseId = (id) => { if (!selectedCaseIds.includes(id)) setSelectedCaseIds(prev => [...prev, id]); };

  const handlePresidentChange = (value) => {
    const presidentId = Number(value);

    setForm((prev) => ({
      ...prev,
      presidentId: Number.isInteger(presidentId) && presidentId > 0 ? presidentId : null,
      memberIds: prev.memberIds.filter((id) => Number(id) !== presidentId),
    }));
    setPresidentSearch('');
    setShowPresidentResults(false);
  };

  const handleSelectPresident = (staffMember) => {
    handlePresidentChange(staffMember.id);
  };

  const toggleMember = (memberId) => {
    const numericMemberId = Number(memberId);
    if (!Number.isInteger(numericMemberId) || numericMemberId <= 0) return;

    setForm((prev) => {
      const hasMember = prev.memberIds.includes(numericMemberId);

      if (hasMember) {
        return {
          ...prev,
          memberIds: prev.memberIds.filter((id) => id !== numericMemberId),
        };
      }

      if (prev.memberIds.length >= MAX_ADDITIONAL_MEMBER_COUNT) {
        return prev;
      }

      return {
        ...prev,
        memberIds: [...prev.memberIds, numericMemberId],
      };
    });
  };

  const handleAddMember = (staffMember) => {
    toggleMember(staffMember.id);
    setMemberSearch('');
    setShowMemberResults(false);
  };

  const handleSave = async () => {
    if (!form.date || !form.time || !form.location.trim() || selectedCases.length === 0 || saving) return;

    if (!form.presidentId) {
      setSaveError('Please choose a president for this meeting.');
      return;
    }

    if (form.memberIds.length !== MAX_ADDITIONAL_MEMBER_COUNT) {
      setSaveError(`You must select exactly ${MAX_ADDITIONAL_MEMBER_COUNT} additional members.`);
      return;
    }

    if (!primaryReporter) {
      setSaveError(
        selectedReporters.length === 0
          ? 'The selected case must have a reporter.'
          : 'Selected cases must share the same reporter to schedule one meeting.'
      );
      return;
    }

    setSaveError('');
    setSaving(true);

    try {
      const presidentStaff = staffMembers.find((member) => member.id === Number(form.presidentId));
      const selectedMemberRows = form.memberIds
        .map((id) => staffMembers.find((member) => member.id === Number(id)))
        .filter(Boolean);

      if (!presidentStaff) {
        throw new Error('Selected president is invalid. Please choose again.');
      }

      if (selectedMemberRows.length !== MAX_ADDITIONAL_MEMBER_COUNT) {
        throw new Error(`You must select exactly ${MAX_ADDITIONAL_MEMBER_COUNT} additional members.`);
      }

      if (primaryReporter.id && Number(primaryReporter.id) === Number(form.presidentId)) {
        throw new Error('The reporter cannot be selected as president.');
      }

      if (primaryReporter.id && selectedMemberRows.some((member) => Number(member.id) === Number(primaryReporter.id))) {
        throw new Error('The reporter is added automatically and cannot be selected as an extra member.');
      }

      const approved = window.confirm('Confirm and validate this meeting?');
      if (!approved) {
        setSaving(false);
        return;
      }

      // Save meeting to database (no PDF generation for admins)

      // Save meeting to database
      const meetingPayload = {
        dateReunion: new Date(form.date).toISOString(),
        heure: form.time,
        lieu: form.location,
        status: 'planifie',
        description_en: form.agenda,
        description_ar: form.agenda,
        anneeUniversitaire: new Date().getFullYear().toString(),
        dossierIds: selectedCases.map(c => Number(c.id.replace('CASE-', ''))),
        presidentId: presidentStaff.id,
        membres: selectedMemberRows.map((member) => ({
          enseignantId: member.id,
          role: 'membre',
        })),
      };

      const response = await request('/api/v1/disciplinary/meetings', {
        method: 'POST',
        body: JSON.stringify(meetingPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response || !response.success) {
        throw new Error(response?.error?.message || 'Failed to save meeting');
      }

      setSaved(true);
      setTimeout(() => onSave(), 1500);
    } catch (error) {
      setSaveError(error?.message || 'Failed to schedule meeting.');
    } finally {
      setSaving(false);
    }
  };

  /* Success state */
  if (saved) {
    return (
      <div className="bg-surface rounded-lg border border-edge shadow-card p-12 text-center">
        {icons.check({ className: 'w-16 h-16 text-success mx-auto mb-4' })}
        <h2 className="text-xl font-bold text-ink mb-2">Meeting Scheduled</h2>
        <p className="text-sm text-ink-secondary">Invitations will be sent to all participants.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left column — 2/3 */}
      <div className="lg:col-span-2 space-y-6">

        {/* Related cases */}
        <div className="bg-surface rounded-lg border border-edge shadow-card p-6">
          <h3 className="text-base font-semibold text-ink mb-4">Related Cases</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedCases.map(c => (
              <div key={c.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/5 border border-edge-strong rounded-md text-xs font-medium text-brand">
                <Avatar name={c.studentName} size="w-5 h-5 text-[8px]" />
                {c.studentName}
                <button
                  onClick={() => removeCaseId(c.id)}
                  className="text-brand/50 hover:text-brand transition-colors"
                >
                  {icons.x({ className: 'w-3 h-3' })}
                </button>
              </div>
            ))}
            {selectedCases.length === 0 && (
              <span className="text-xs text-ink-muted">No cases selected yet.</span>
            )}
          </div>
          <select
            onChange={e => { addCaseId(e.target.value); e.target.value = ''; }}
            defaultValue=""
            className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
          >
            <option value="" disabled>+ Add a case...</option>
            {cases.filter(c => !selectedCaseIds.includes(c.id) && c.status === 'signale').map(c => (
              <option key={c.id} value={c.id}>{c.studentName} ({c.id})</option>
            ))}
          </select>
        </div>

        {/* Meeting details */}
        <div className="bg-surface rounded-lg border border-edge shadow-card p-6">
          <h3 className="text-base font-semibold text-ink mb-4">Meeting Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Title</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink-secondary mb-1">Location / Link</label>
              <input
                placeholder="Room, address, or video conference link..."
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1">Agenda / Grounds</label>
            <textarea
              value={form.agenda}
              onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
              placeholder="Describe the grounds for the hearing..."
              rows={4}
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
            />
          </div>
        </div>
      </div>

      {/* Right column — 1/3 */}
      <div className="space-y-6">

        {/* Participants */}
        <div className="bg-surface rounded-lg border border-edge shadow-card p-6">
          <h3 className="text-base font-semibold text-ink mb-4">Council Members</h3>

          {/* President with search */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">President</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or grade..."
                value={presidentSearch}
                onChange={(e) => handlePresidentSearch(e.target.value)}
                onFocus={() => presidentSearch.length >= 2 && setShowPresidentResults(true)}
                className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              {showPresidentResults && presidentSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-edge rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                  {presidentSearchResults.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectPresident(member)}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-surface-200 transition-colors text-sm text-ink border-b border-edge-subtle last:border-b-0"
                    >
                      <span className="font-medium">{member.name}</span>
                      <span className="text-ink-muted ml-2">({member.grade})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedPresident && (
              <div className="mt-2 flex items-center gap-3 px-3 py-2.5 bg-success/5 border border-edge-strong rounded-md">
                <Avatar name={selectedPresident.name} size="w-6 h-6 text-[9px]" />
                <div>
                  <span className="text-sm font-medium text-success">{selectedPresident.name}</span>
                  <p className="text-[11px] text-success/80">Role: President</p>
                </div>
              </div>
            )}
          </div>

          {/* Reporter (auto) */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Reporter</label>
            {selectedReporters.length === 0 && (
              <p className="text-xs text-ink-muted px-3 py-2 bg-surface-200 rounded-md border border-edge-subtle">
                Select a case to load the reporter automatically.
              </p>
            )}
            {selectedReporters.map((reporter) => (
              <div key={reporter.key} className="mb-2 flex items-center gap-3 px-3 py-2.5 bg-brand/5 border border-edge-strong rounded-md">
                <Avatar name={reporter.name} size="w-6 h-6 text-[9px]" />
                <div>
                  <span className="text-sm font-medium text-brand">{reporter.name}</span>
                  <p className="text-[11px] text-brand/80">Role: Rapporteur (auto from case)</p>
                </div>
              </div>
            ))}
            {selectedReporters.length > 1 && (
              <p className="text-xs text-danger bg-danger/5 border border-edge-strong rounded-md px-3 py-2">
                Selected cases do not share the same reporter. Choose cases reported by the same teacher.
              </p>
            )}
          </div>

          {/* Members with search */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
              Members <span className="normal-case font-normal text-ink-muted">(exactly {MAX_ADDITIONAL_MEMBER_COUNT} required — the reporter is not counted as a member)</span>
            </label>
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search by name or grade to add members..."
                value={memberSearch}
                onChange={(e) => handleMemberSearch(e.target.value)}
                onFocus={() => memberSearch.length >= 2 && setShowMemberResults(true)}
                className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              {showMemberResults && memberSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-edge rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                  {memberSearchResults
                    .filter((member) => {
                      const isPresident = Number(form.presidentId) === Number(member.id);
                      const isReporter = primaryReporter?.id != null && Number(primaryReporter.id) === Number(member.id);
                      const isAlreadySelected = form.memberIds.includes(member.id);
                      return !isPresident && !isReporter && !isAlreadySelected;
                    })
                    .map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleAddMember(member)}
                        type="button"
                        disabled={form.memberIds.length >= MAX_ADDITIONAL_MEMBER_COUNT}
                        className="w-full text-left px-3 py-2 hover:bg-surface-200 transition-colors text-sm text-ink border-b border-edge-subtle last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="font-medium">{member.name}</span>
                        <span className="text-ink-muted ml-2">({member.grade})</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="space-y-1">
              {form.memberIds.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-ink-secondary mb-1">Selected members:</p>
                  {form.memberIds.map((memberId) => {
                    const member = staffMembers.find((m) => m.id === memberId);
                    return member ? (
                      <div key={memberId} className="flex items-center gap-2 px-2 py-1.5 bg-brand/5 border border-edge-strong rounded-md">
                        <Avatar name={member.name} size="w-5 h-5 text-[8px]" />
                        <span className="flex-1 text-sm text-ink">{member.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleMember(memberId)}
                          className="text-brand/50 hover:text-brand transition-colors"
                        >
                          {icons.x({ className: 'w-3 h-3' })}
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              {form.memberIds.length < MAX_ADDITIONAL_MEMBER_COUNT && (
                <p className="text-xs text-ink-muted bg-surface-200 rounded-md px-2 py-1">
                  You need to select {MAX_ADDITIONAL_MEMBER_COUNT - form.memberIds.length} more member{MAX_ADDITIONAL_MEMBER_COUNT - form.memberIds.length === 1 ? '' : 's'}.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {saveError && (
            <p className="text-xs text-danger bg-danger/5 border border-edge-strong rounded-md px-3 py-2">
              {saveError}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={
              !form.date
              || !form.time
              || !form.location.trim()
              || selectedCases.length === 0
              || !form.presidentId
              || form.memberIds.length !== MAX_ADDITIONAL_MEMBER_COUNT
              || selectedReporters.length !== 1
              || saving
            }
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-brand/30 focus:ring-offset-2"
          >
            {icons.check({ className: 'w-4 h-4' })}
            {saving ? 'Validating meeting...' : 'Confirm &amp; Validate Meeting'}
          </button>
          <button
            onClick={onCancel}
            className="w-full px-4 py-2.5 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150 focus:ring-2 focus:ring-brand/30 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MEETING DETAIL VIEW
   ═══════════════════════════════════════════════════════════════ */

function MeetingDetailView({
  meeting,
  cases,
  staff = STAFF_MEMBERS_DEFAULT,
  decisionChoices = [],
  canManageMeeting = false,
  viewOnly = false,
  currentEnseignantId = null,
  onBack,
  onMeetingUpdated,
  onMeetingDeleted,
  onFinalized,
}) {
  const [meetingState, setMeetingState] = useState(meeting);
  const [relatedCasesData, setRelatedCasesData] = useState([]);
  
  // Fetch the full meeting details including related cases when component mounts
  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        if (meeting?.conseilId) {
          const response = await request(`/api/v1/disciplinary/conseils/${meeting.conseilId}`);
          if (response?.data) {
            const fullMeeting = normalizeMeeting(response.data);
            setMeetingState(fullMeeting);
            
            // Extract and normalize related dossiers from the response
            if (response.data?.dossiers && Array.isArray(response.data.dossiers)) {
              const normalizedDossiers = response.data.dossiers.map(normalizeCase).filter(Boolean);
              setRelatedCasesData(normalizedDossiers);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch meeting details:', error);
      }
    };

    fetchMeetingDetails();
  }, [meeting?.conseilId]);
  
  const relatedCases = useMemo(
    () => {
      // Use related cases from backend if available, otherwise fallback to looking up in cases array
      if (relatedCasesData.length > 0) {
        return relatedCasesData;
      }
      return (meetingState.caseIds || []).map((cid) => cases.find((c) => c.id === cid)).filter(Boolean);
    },
    [meetingState.caseIds, cases, relatedCasesData]
  );
  const staffMembers = useMemo(() => {
    const seenStaffIds = new Set();

    return (Array.isArray(staff) ? staff : [])
      .map((member, index) => {
        if (member && typeof member === 'object') {
          const fallbackId = index + 1;
          const parsedId = Number(member.id);
          const name = member.name || [member.prenom, member.nom].filter(Boolean).join(' ').trim();

          return {
            id: Number.isInteger(parsedId) && parsedId > 0 ? parsedId : fallbackId,
            name: name || `Staff #${fallbackId}`,
            grade: member.grade || 'Staff',
          };
        }

        return {
          id: index + 1,
          name: String(member || `Staff #${index + 1}`),
          grade: 'Staff',
        };
      })
      .filter((member) => {
        if (!Number.isInteger(member.id) || member.id <= 0 || !member.name) return false;
        if (seenStaffIds.has(member.id)) return false;
        seenStaffIds.add(member.id);
        return true;
      });
  }, [staff]);

  const buildEditForm = useCallback((meetingValue) => {
    const entries = Array.isArray(meetingValue?.memberEntries) ? meetingValue.memberEntries : [];
    const presidentEntry = entries.find((entry) => entry.role === 'president') || null;
    const memberIds = entries
      .filter((entry) => entry.role === 'membre')
      .map((entry) => Number(entry.enseignantId))
      .filter((id) => Number.isInteger(id) && id > 0)
      .slice(0, MAX_ADDITIONAL_MEMBER_COUNT);

    return {
      date: toDateInputValue(meetingValue?.date),
      time: toTimeInputValue(meetingValue?.time),
      location: meetingValue?.location === 'TBD' ? '' : (meetingValue?.location || ''),
      agenda: meetingValue?.agenda || '',
      presidentId:
        Number.isInteger(Number(presidentEntry?.enseignantId)) && Number(presidentEntry?.enseignantId) > 0
          ? Number(presidentEntry.enseignantId)
          : null,
      memberIds,
    };
  }, []);

  const [decisions, setDecisions] = useState(
    Object.fromEntries(relatedCases.map((c) => [c.id, { decision: '', justification: '', newStatus: c.status }]))
  );
  const [globalNotes, setGlobalNotes] = useState(meetingState.agenda || '');
  const [finalized, setFinalized] = useState(meetingState.status === 'finalized');
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [editForm, setEditForm] = useState(() => buildEditForm(meetingState));

  useEffect(() => {
    setMeetingState(meeting);
    setFinalized(meeting.status === 'finalized');
    setGlobalNotes(meeting.agenda || '');
    setEditMode(false);
    setAdminError('');
    setEditForm(buildEditForm(meeting));
  }, [meeting, buildEditForm]);

  useEffect(() => {
    setDecisions(Object.fromEntries(relatedCases.map((c) => [c.id, { decision: '', justification: '', newStatus: c.status }])));
  }, [relatedCases]);

  const reporterMember = useMemo(
    () => (Array.isArray(meetingState.memberEntries) ? meetingState.memberEntries.find((entry) => entry.role === 'rapporteur') : null) || null,
    [meetingState.memberEntries]
  );

  const staffNameById = useMemo(
    () => new Map(staffMembers.map((member) => [Number(member.id), member.name])),
    [staffMembers]
  );

  const reporterDisplayName = useMemo(() => {
    const reporterId = Number(reporterMember?.enseignantId);
    const reporterFromMeeting = (reporterMember?.name || '').trim();
    if (reporterFromMeeting && !/^unknown/i.test(reporterFromMeeting)) {
      return reporterFromMeeting;
    }

    const reporterFromStaff = Number.isInteger(reporterId) && reporterId > 0
      ? (staffNameById.get(reporterId) || '')
      : '';
    if (reporterFromStaff) {
      return reporterFromStaff;
    }

    const reporterNamesFromCases = Array.from(
      new Set(relatedCases.map((c) => (c.reporterName || '').trim()).filter(Boolean))
    );
    if (reporterNamesFromCases.length === 1) {
      return reporterNamesFromCases[0];
    }

    if (Number.isInteger(reporterId) && reporterId > 0) {
      return `Teacher #${reporterId}`;
    }

    return 'Reporter';
  }, [reporterMember, staffNameById, relatedCases]);

  const participantDisplayNames = useMemo(() => {
    const entries = Array.isArray(meetingState.memberEntries) ? meetingState.memberEntries : [];

    if (entries.length > 0) {
      // Filter out rapporteur - they are shown separately as reporter info
      return entries
        .filter((entry) => entry?.role !== 'rapporteur')
        .map((entry) => {
          const rawName = (entry?.name || '').trim();
          const enseignantId = Number(entry?.enseignantId);

          if (rawName && !/^unknown/i.test(rawName)) {
            return rawName;
          }

          const fromStaff = Number.isInteger(enseignantId) && enseignantId > 0
            ? (staffNameById.get(enseignantId) || '')
            : '';
          if (fromStaff) {
            return fromStaff;
          }

          return Number.isInteger(enseignantId) && enseignantId > 0 ? `Teacher #${enseignantId}` : 'Member';
        });
    }

    return (Array.isArray(meetingState.participants) ? meetingState.participants : [])
      .map((name, index) => (String(name || '').trim() || `Member ${index + 1}`));
  }, [meetingState.memberEntries, meetingState.participants, staffNameById]);

  const selectedEditPresident = staffMembers.find((member) => Number(member.id) === Number(editForm.presidentId)) || null;
  const availableEditMemberChoicesCount = staffMembers.filter((member) => {
    const isPresident = Number(editForm.presidentId) === Number(member.id);
    const isReporter = reporterMember?.enseignantId != null && Number(reporterMember.enseignantId) === Number(member.id);
    return !isPresident && !isReporter;
  }).length;

  useEffect(() => {
    if (staffMembers.length === 0) return;

    setEditForm((prev) => {
      const currentPresidentId = Number(prev.presidentId);
      const hasCurrentPresident = staffMembers.some((member) => member.id === currentPresidentId);
      const nextPresidentId = hasCurrentPresident ? currentPresidentId : (staffMembers[0]?.id || null);

      const normalizedMemberIds = (Array.isArray(prev.memberIds) ? prev.memberIds : [])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
        .filter((id) => staffMembers.some((member) => member.id === id))
        .filter((id) => id !== nextPresidentId)
        .slice(0, MAX_ADDITIONAL_MEMBER_COUNT);

      return {
        ...prev,
        presidentId: nextPresidentId,
        memberIds: normalizedMemberIds,
      };
    });
  }, [staffMembers]);

  const isPresident =
    currentEnseignantId != null
    && meetingState.presidentEnseignantId != null
    && Number(currentEnseignantId) === Number(meetingState.presidentEnseignantId);

  const canEditOrDeleteMeeting = canManageMeeting && !finalized;

  const handleEditPresidentChange = (value) => {
    const presidentId = Number(value);

    setEditForm((prev) => ({
      ...prev,
      presidentId: Number.isInteger(presidentId) && presidentId > 0 ? presidentId : null,
      memberIds: prev.memberIds.filter((id) => Number(id) !== presidentId),
    }));
  };

  const toggleEditMember = (memberId) => {
    const normalizedId = Number(memberId);
    if (!Number.isInteger(normalizedId) || normalizedId <= 0) return;

    setEditForm((prev) => {
      const hasMember = prev.memberIds.includes(normalizedId);

      if (hasMember) {
        return {
          ...prev,
          memberIds: prev.memberIds.filter((id) => id !== normalizedId),
        };
      }

      if (prev.memberIds.length >= MAX_ADDITIONAL_MEMBER_COUNT) {
        return prev;
      }

      return {
        ...prev,
        memberIds: [...prev.memberIds, normalizedId],
      };
    });
  };

  const DECISION_OPTIONS = decisionChoices.length > 0
    ? [{ value: '', label: 'Choose a decision...' },
      ...decisionChoices.map((option) => ({
        value: String(option.id),
        label: option.nom_en || option.nom_ar || `Decision #${option.id}`,
      }))]
    : [
        { value: '', label: 'Choose a decision...' },
        { value: 'avertissement', label: 'Avertissement' },
        { value: 'blame', label: 'Blame' },
        { value: 'suspension', label: 'Suspension' },
        { value: 'exclusion', label: 'Exclusion' },
      ];

  const handleUpdateMeeting = async () => {
    if (!canEditOrDeleteMeeting || editBusy || !meetingState.conseilId) return;

    if (!editForm.date || !editForm.time || !editForm.location.trim()) {
      setAdminError('Date, time, and location are required to update this meeting.');
      return;
    }

    if (!editForm.presidentId) {
      setAdminError('Please choose a president.');
      return;
    }

    if (editForm.memberIds.length > MAX_ADDITIONAL_MEMBER_COUNT) {
      setAdminError(`You can select up to ${MAX_ADDITIONAL_MEMBER_COUNT} additional members.`);
      return;
    }

    if (reporterMember?.enseignantId && Number(reporterMember.enseignantId) === Number(editForm.presidentId)) {
      setAdminError('The reporter cannot be selected as president.');
      return;
    }

    if (
      reporterMember?.enseignantId
      && editForm.memberIds.some((id) => Number(id) === Number(reporterMember.enseignantId))
    ) {
      setAdminError('The reporter is added automatically and cannot be selected as an extra member.');
      return;
    }

    setAdminError('');
    setEditBusy(true);

    try {
      const selectedMemberRows = editForm.memberIds
        .map((id) => staffMembers.find((member) => Number(member.id) === Number(id)))
        .filter(Boolean);

      if (selectedMemberRows.length > MAX_ADDITIONAL_MEMBER_COUNT) {
        throw new Error(`You can select up to ${MAX_ADDITIONAL_MEMBER_COUNT} valid members.`);
      }

      const response = await request(`/api/v1/disciplinary/conseils/${meetingState.conseilId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          dateReunion: new Date(editForm.date).toISOString(),
          heure: editForm.time,
          lieu: editForm.location.trim(),
          description: editForm.agenda,
          presidentId: Number(editForm.presidentId),
          membres: selectedMemberRows.map((member) => ({
            enseignantId: member.id,
            role: 'membre',
          })),
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response || response.success === false || !response.data) {
        throw new Error(response?.error?.message || 'Failed to update meeting.');
      }

      const updatedMeeting = normalizeMeeting(response.data);
      setMeetingState(updatedMeeting);
      setGlobalNotes(updatedMeeting.agenda || globalNotes);
      setEditMode(false);

      if (typeof onMeetingUpdated === 'function') {
        await onMeetingUpdated(updatedMeeting);
      }
    } catch (error) {
      setAdminError(error?.message || 'Failed to update meeting.');
    } finally {
      setEditBusy(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!canEditOrDeleteMeeting || deleteBusy || !meetingState.conseilId) return;

    const approved = window.confirm('Delete this meeting? Related cases will return to pending state.');
    if (!approved) return;

    setAdminError('');
    setDeleteBusy(true);

    try {
      const response = await request(`/api/v1/disciplinary/conseils/${meetingState.conseilId}`, {
        method: 'DELETE',
      });

      if (!response || response.success === false) {
        throw new Error(response?.error?.message || 'Failed to delete meeting.');
      }

      if (typeof onMeetingDeleted === 'function') {
        await onMeetingDeleted();
      }
    } catch (error) {
      setAdminError(error?.message || 'Failed to delete meeting.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleFinalize = async () => {
    if (finalized || finalizing || !isPresident) return;

    setFinalizeError('');
    setFinalizing(true);

    try {
      const drafts = relatedCases.map((c) => {
        const d = decisions[c.id] || {};
        const draft = {
          caseId: Number(String(c.id).replace('CASE-', '')),
          sanctions: d.justification || globalNotes || '',
          dateDecision: new Date().toISOString(),
        };

        const selectedDecisionId = Number(d.decision);
        if (Number.isInteger(selectedDecisionId) && selectedDecisionId > 0) {
          draft.decisionId = selectedDecisionId;
        } else {
          draft.decision = d.decision || 'Dismissed';
        }

        return draft;
      });

      const response = await request(`/api/v1/disciplinary/conseils/${meetingState.conseilId}/finaliser`, {
        method: 'PATCH',
        body: JSON.stringify({ drafts }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response || response.success === false) {
        throw new Error(response?.error?.message || 'Failed to finalize meeting.');
      }

      await downloadMeetingFormPdf({
        title: meetingState.title || 'Conseil disciplinaire',
        meetingDate: meetingState.date,
        meetingTime: meetingState.time,
        meetingLocation: meetingState.location,
        agenda: globalNotes,
        studentRows: relatedCases.map((item) => ({
          caseId: item.id,
          studentName: item.studentName,
          studentId: item.studentId,
          violationType: item.violationType,
          caseDate: item.dateReported || item.dateOfIncident,
        })),
        memberRows: participantDisplayNames.map((name, index) => ({
          name,
          role: index === 0 ? 'Président' : 'Membre',
        })),
      });

      setFinalized(true);
      setMeetingState((prev) => ({ ...prev, status: 'finalized' }));

      if (typeof onFinalized === 'function') {
        await onFinalized();
      }
    } catch (error) {
      setFinalizeError(error?.message || 'Failed to finalize meeting.');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Back + Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink transition-colors duration-100 mb-4 focus:ring-2 focus:ring-brand/30 rounded"
        >
          {icons.arrowLeft({ className: 'w-4 h-4' })}
          Back to Meetings
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-ink tracking-tight">{meetingState.title || 'Conseil disciplinaire'}</h1>
              <StatusBadge status={finalized ? 'finalized' : meetingState.status} config={MEETING_STATUS_CONFIG} />
            </div>
            <p className="text-sm text-ink-tertiary">
              {formatDateLong(meetingState.date)} · {meetingState.time} · {meetingState.location}
            </p>
          </div>

          {canManageMeeting && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAdminError('');
                  setEditMode((prev) => !prev);
                }}
                disabled={!canEditOrDeleteMeeting || editBusy || deleteBusy}
                className="px-3 py-2 text-xs font-medium text-brand bg-brand/5 border border-edge-strong rounded-md hover:bg-brand/10 transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editMode ? 'Cancel Edit' : 'Edit Meeting'}
              </button>
              <button
                onClick={handleDeleteMeeting}
                disabled={!canEditOrDeleteMeeting || editBusy || deleteBusy}
                className="px-3 py-2 text-xs font-medium text-danger bg-danger/5 border border-edge-strong rounded-md hover:bg-danger/10 transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteBusy ? 'Deleting...' : 'Delete Meeting'}
              </button>
            </div>
          )}
        </div>
      </div>

      {editMode && canEditOrDeleteMeeting && (
        <div className="bg-surface rounded-lg border border-edge shadow-card p-6">
          <h3 className="text-base font-semibold text-ink mb-4">Edit Meeting</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Date</label>
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Time</label>
              <input
                type="time"
                value={editForm.time}
                onChange={(e) => setEditForm((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink-secondary mb-1">Location</label>
              <input
                value={editForm.location}
                onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink-secondary mb-1">Agenda / Grounds</label>
            <textarea
              value={editForm.agenda}
              onChange={(e) => setEditForm((prev) => ({ ...prev, agenda: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
            />
          </div>

          <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface-200/40 border border-edge-subtle rounded-md p-4">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">President</label>
              <select
                value={editForm.presidentId || ''}
                onChange={(e) => handleEditPresidentChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand"
              >
                <option value="" disabled>Select president...</option>
                {staffMembers.map((member) => (
                  <option key={member.id} value={member.id}>{member.name} ({member.grade})</option>
                ))}
              </select>
              {selectedEditPresident && (
                <p className="mt-2 text-xs text-ink-secondary">Selected: {selectedEditPresident.name}</p>
              )}
            </div>

            <div className="bg-surface-200/40 border border-edge-subtle rounded-md p-4">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Reporter (Auto)</label>
              <div className="flex items-center gap-2 text-sm text-ink">
                <Avatar name={reporterDisplayName} size="w-6 h-6 text-[9px]" />
                <span>{reporterDisplayName}</span>
              </div>
            </div>
          </div>

          <div className="mb-4 bg-surface-200/40 border border-edge-subtle rounded-md p-4">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
              {`Additional Members (exactly ${MAX_ADDITIONAL_MEMBER_COUNT})`}
            </label>
            {availableEditMemberChoicesCount <= 2 && (
              <p className="mb-2 text-xs text-ink-muted">
                Only {availableEditMemberChoicesCount} selectable teacher{availableEditMemberChoicesCount === 1 ? '' : 's'} currently available after president/reporter assignment.
              </p>
            )}
            <div className="space-y-1 max-h-52 overflow-auto pr-1">
              {staffMembers.map((member) => {
                const isSelected = editForm.memberIds.includes(member.id);
                const isPresident = Number(editForm.presidentId) === Number(member.id);
                const isReporter = reporterMember?.enseignantId != null && Number(reporterMember.enseignantId) === Number(member.id);
                const lockBecauseMaxReached = editForm.memberIds.length >= MAX_ADDITIONAL_MEMBER_COUNT && !isSelected;

                return (
                  !isPresident && (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-surface-200 dark:hover:bg-surface-300/20 transition-colors duration-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEditMember(member.id)}
                        disabled={isReporter || lockBecauseMaxReached}
                        className="rounded border-control-border text-brand focus:ring-brand/30"
                      />
                      <Avatar name={member.name} size="w-6 h-6 text-[9px]" />
                      <span className="text-sm text-ink">{member.name}</span>
                      {isReporter && <span className="ml-auto text-[11px] text-ink-muted">Reporter</span>}
                    </label>
                  )
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUpdateMeeting}
              disabled={editBusy}
              className="px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {icons.save({ className: 'w-4 h-4' })}
              {editBusy ? 'Saving changes...' : 'Save Meeting Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Participants summary */}
      <div className="bg-surface rounded-lg border border-edge shadow-card p-5 flex flex-col sm:flex-row flex-wrap gap-6">
        {/* Reporter (shown separately as info, not in member list) */}
        {reporterDisplayName && (
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Reporter</p>
            <div className="flex items-center gap-2 text-xs text-ink-secondary">
              <Avatar name={reporterDisplayName} size="w-6 h-6 text-[9px]" />
              {reporterDisplayName}
              <span className="text-brand/60 ml-1">(Rapporteur)</span>
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Members</p>
          <div className="flex items-center gap-3 flex-wrap">
            {participantDisplayNames.map((p, index) => (
              <div key={`${p}-${index}`} className="flex items-center gap-2 text-xs text-ink-secondary">
                <Avatar name={p} size="w-6 h-6 text-[9px]" />
                {p}
              </div>
            ))}
          </div>
        </div>
        <div className="sm:border-l sm:border-edge sm:pl-6">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Related Cases</p>
          <div className="space-y-2">
            {relatedCases.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <Avatar name={c.studentName} size="w-5 h-5 text-[8px]" />
                <div className="text-xs">
                  <p className="font-medium text-ink">{c.studentName}</p>
                  {c.reporterName && (
                    <p className="text-ink-secondary">by {c.reporterName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-case decision cards */}
      {relatedCases.map((c) => (
        <div key={c.id} className="bg-surface rounded-lg border border-edge shadow-card">
          {/* Student header */}
          <div className="px-6 py-4 border-b border-edge-subtle flex items-center gap-3">
            <Avatar name={c.studentName} size="w-9 h-9 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{c.studentName}</p>
              <p className="text-xs text-ink-muted">{c.studentId} · {c.department} · {c.violationType}</p>
              {c.reporterName && (
                <p className="text-xs text-ink-secondary mt-1">
                  Reported by: {c.reporterName}
                </p>
              )}
            </div>
            <StatusBadge status={c.status} config={CASE_STATUS_CONFIG} />
          </div>

          {/* Case context */}
          <div className="mx-6 mb-4 mt-4 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
            {icons.alert({ className: 'w-4 h-4 text-warning shrink-0' })}
            <p className="text-xs text-warning">
              Case {c.id} — {c.description.substring(0, 120)}{c.description.length > 120 ? '...' : ''}
            </p>
          </div>

          {/* Decision form — editable only by president, view-only when finalized */}
          <div className="px-6 pb-6">
            {finalized && c.decision ? (
              // Display finalized decision
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-1">Decision</label>
                    <div className="px-3 py-2.5 text-sm bg-success/5 border border-edge rounded-md text-ink rounded-md">
                      {c.decision.verdict || 'Decision Recorded'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-1">Status</label>
                    <div className="px-3 py-2.5 text-sm bg-success/5 border border-edge rounded-md text-ink rounded-md">
                      {c.status === 'closed' ? 'Closed' : c.status === 'hearing' ? 'Hearing' : c.status === 'pending' ? 'Pending' : c.status}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-1">Decision Details</label>
                  <div className="px-3 py-2.5 text-sm bg-success/5 border border-edge rounded-md text-ink">
                    {c.decision.details || 'No additional remarks'}
                  </div>
                </div>
              </div>
            ) : (
              // Edit form for president
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-1">Decision</label>
                    <select
                      value={decisions[c.id]?.decision || ''}
                      onChange={(e) => setDecisions((d) => ({ ...d, [c.id]: { ...d[c.id], decision: e.target.value } }))}
                      disabled={finalized || !isPresident || viewOnly}
                      className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {DECISION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-1">New Status</label>
                    <select
                      value={decisions[c.id]?.newStatus || ''}
                      onChange={(e) => setDecisions((d) => ({ ...d, [c.id]: { ...d[c.id], newStatus: e.target.value } }))}
                      disabled={finalized || !isPresident || viewOnly}
                      className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {Object.entries(CASE_STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-1">Justification</label>
                  <textarea
                    value={decisions[c.id]?.justification || ''}
                    onChange={(e) => setDecisions((d) => ({ ...d, [c.id]: { ...d[c.id], justification: e.target.value } }))}
                    placeholder="Grounds and details for the decision..."
                    rows={3}
                    disabled={finalized || !isPresident || viewOnly}
                    className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Global notes / minutes */}
      <div className="bg-surface rounded-lg border border-edge shadow-card p-6">
        <h3 className="text-base font-semibold text-ink mb-3">Minutes / Global Notes</h3>
        <textarea
          value={globalNotes}
          onChange={(e) => setGlobalNotes(e.target.value)}
          placeholder="Summary of deliberations, general observations..."
          rows={4}
          disabled={finalized || !isPresident || viewOnly}
          className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Finalize — president only */}
      {!finalized && isPresident && !viewOnly && (
        <div className="flex justify-end">
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className="px-6 py-2.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-brand/30 focus:ring-offset-2"
          >
            {icons.check({ className: 'w-4 h-4' })}
            {finalizing ? 'Submitting decision...' : 'Validate Meeting &amp; Record Decision'}
          </button>
        </div>
      )}

      {!finalized && !isPresident && (
        <div className="flex items-center gap-3 rounded-lg border border-edge-strong bg-surface-200/40 px-5 py-4">
          {icons.lock({ className: 'w-5 h-5 text-ink-muted' })}
          <span className="text-sm text-ink-secondary">
            Only the council president can record the decision and validate the meeting.
          </span>
        </div>
      )}

      {(finalizeError || adminError) && (
        <div className="rounded-lg border border-edge-strong bg-danger/10 px-5 py-4">
          <span className="text-sm font-medium text-danger">{finalizeError || adminError}</span>
        </div>
      )}

      {finalized && (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-5 py-4">
          {icons.check({ className: 'w-5 h-5 text-success' })}
          <span className="text-sm font-medium text-success">Meeting finalized — statuses have been updated.</span>
        </div>
      )}
    </div>
  );
}

