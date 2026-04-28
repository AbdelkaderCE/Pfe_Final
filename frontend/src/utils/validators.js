/*
  Form & data validators — Ibn Khaldoun University Platform.
  Algerian-locale validators for phone, student ID, employee ID, passwords.
*/

import { PASSWORD_MIN_LENGTH, PASSWORD_REGEX } from './constants';

/* ── Field validators ───────────────────────────────────────── */

export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password) => {
    return password.length >= PASSWORD_MIN_LENGTH && PASSWORD_REGEX.test(password);
  },

  passwordMatch: (password, confirmPassword) => {
    return password === confirmPassword;
  },

  required: (value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return true;
    if (Array.isArray(value)) return value.length > 0;
    if (value === null || value === undefined) return false;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  },

  minLength: (value, min) => {
    return value.length >= min;
  },

  maxLength: (value, max) => {
    return value.length <= max;
  },

  /** Algerian phone: +213 or 0 followed by 5/6/7 then 8 digits */
  phone: (phone) => {
    const phoneRegex = /^(\+213|0)[5-7]\d{8}$/;
    return phoneRegex.test(phone);
  },

  numeric: (value) => {
    return /^\d+$/.test(value);
  },

  alphanumeric: (value) => {
    return /^[a-zA-Z0-9]+$/.test(value);
  },

  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /** Student ID: exactly 10 digits */
  studentId: (id) => {
    return /^\d{10}$/.test(id);
  },

  /** Employee ID: 3 uppercase letters + 4 digits (e.g. ABC1234) */
  employeeId: (id) => {
    return /^[A-Z]{3}\d{4}$/.test(id);
  },
};

/* ── Password strength ──────────────────────────────────────── */

/**
 * Returns 'weak' | 'medium' | 'strong' based on character variety.
 */
export const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

/* ── Generic form validator ─────────────────────────────────── */

/**
 * Validate an object against a rules map.
 * @param {Object} data   — form data
 * @param {Object} rules  — { fieldName: [validatorFn, …] }
 * @returns {Object}      — { fieldName: ['Invalid fieldName', …] }
 */
export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach((key) => {
    const fieldRules = rules[key];
    const value = data[key];

    if (fieldRules) {
      fieldRules.forEach((rule) => {
        if (!rule(value)) {
          if (!errors[key]) errors[key] = [];
          errors[key].push(`Invalid ${key}`);
        }
      });
    }
  });

  return errors;
};
