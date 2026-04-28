/*
  Data formatters — Ibn Khaldoun University Platform.
  Algerian locale (fr-DZ), DZD currency, grade text, file sizes.
*/

import { DATE_FORMAT, DATETIME_FORMAT, TIME_FORMAT } from './constants';

/* ── Core formatters ────────────────────────────────────────── */

export const formatters = {
  date: (date, format = DATE_FORMAT) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  },

  time: (date, format = TIME_FORMAT) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  datetime: (date, format = DATETIME_FORMAT) => {
    const d = new Date(date);
    const parts = format.split(' ');
    return formatters.date(d, parts[0]) + ' ' + formatters.time(d, parts[1]);
  },

  /** Format to Algerian Dinar (DZD) using fr-DZ locale */
  currency: (amount, currency = 'DZD') => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  number: (num, decimals = 2) => {
    return new Intl.NumberFormat('fr-DZ', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  },

  percentage: (value, decimals = 1) => {
    return `${formatters.number(value * 100, decimals)}%`;
  },

  /** Format Algerian phone: +213 XX XXX XXX */
  phone: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('213')) {
      return `+213 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    return phone;
  },

  fullName: (prenom, nom) => {
    return `${prenom} ${nom}`;
  },

  truncate: (text, length = 100, suffix = '...') => {
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
  },

  capitalize: (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  titleCase: (text) => {
    return text
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  fileSize: (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${formatters.number(size, 2)} ${units[unitIndex]}`;
  },

  /** Get initials from a full name: "John Doe" → "JD" */
  initials: (name) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  },

  /** Slug: "Hello World" → "hello-world" */
  slugify: (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  },
};

/* ── Grade helpers ──────────────────────────────────────────── */

/** Convert numeric grade (0-20) to descriptive text */
export const gradeFormatter = (grade) => {
  if (grade >= 16) return 'Excellent';
  if (grade >= 14) return 'Very Good';
  if (grade >= 12) return 'Good';
  if (grade >= 10) return 'Pass';
  return 'Fail';
};

/** Grade-appropriate Tailwind text color using design-system tokens */
export const getGradeColor = (grade) => {
  if (grade >= 16) return 'text-success';
  if (grade >= 14) return 'text-brand';
  if (grade >= 12) return 'text-warning';
  if (grade >= 10) return 'text-ink-secondary';
  return 'text-danger';
};
