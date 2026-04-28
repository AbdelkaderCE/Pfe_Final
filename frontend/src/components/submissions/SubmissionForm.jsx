/*
  SubmissionForm — Unified form for Justifications / Reclamations.
  Supports both guests and authenticated users:
    - If logged in: sends { type, subject, message } — backend binds userId from token.
    - If guest: requires firstName, lastName, email (plus message).
  Posts to: POST /api/v1/submissions
*/

import React, { useState } from 'react';
import request from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TYPES = [
  { value: 'RECLAMATION', label: 'Reclamation' },
  { value: 'JUSTIFICATION', label: 'Justification' },
];

const initialGuestFields = { firstName: '', lastName: '', email: '' };

export default function SubmissionForm({ onSubmitted }) {
  const { user, isAuthenticated } = useAuth();
  const [type, setType] = useState('RECLAMATION');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [guest, setGuest] = useState(initialGuestFields);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ kind: 'idle', text: '' });

  const updateGuestField = (key) => (event) =>
    setGuest((prev) => ({ ...prev, [key]: event.target.value }));

  const resetForm = () => {
    setSubject('');
    setMessage('');
    if (!isAuthenticated) setGuest(initialGuestFields);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ kind: 'idle', text: '' });

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setStatus({ kind: 'error', text: 'Message is required.' });
      return;
    }

    const payload = {
      type,
      subject: subject.trim() || undefined,
      message: trimmedMessage,
    };

    if (!isAuthenticated) {
      if (!guest.firstName.trim() || !guest.lastName.trim() || !guest.email.trim()) {
        setStatus({ kind: 'error', text: 'First name, last name, and email are required.' });
        return;
      }
      payload.firstName = guest.firstName.trim();
      payload.lastName = guest.lastName.trim();
      payload.email = guest.email.trim();
    }

    try {
      setSubmitting(true);
      const res = await request('/api/v1/submissions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStatus({ kind: 'success', text: 'Submitted successfully.' });
      resetForm();
      onSubmitted?.(res?.data);
    } catch (err) {
      setStatus({ kind: 'error', text: err?.message || 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {isAuthenticated && user && (
        <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
          Submitting as <span className="font-medium">{user.prenom} {user.nom}</span> · {user.email}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {!isAuthenticated && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              value={guest.firstName}
              onChange={updateGuestField('firstName')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              type="text"
              value={guest.lastName}
              onChange={updateGuestField('lastName')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={guest.email}
              onChange={updateGuestField('email')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject (optional)</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          maxLength={255}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[140px]"
          required
        />
      </div>

      {status.kind === 'error' && (
        <p className="text-sm text-rose-600">{status.text}</p>
      )}
      {status.kind === 'success' && (
        <p className="text-sm text-emerald-600">{status.text}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  );
}
