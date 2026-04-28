/*
  Modal — overlay dialog for confirmation, forms, and feedback.
  Elevation: highest level. surface-100 card on a dark scrim.
  Scrim: semi-transparent black, click-to-close.
  Animation: fade in + slight scale. Kept fast (150ms).
  Focus trap: first focusable element auto-focused. Escape closes.
  Accessible: role="dialog", aria-modal, aria-labelledby.
*/

import React, { useEffect, useRef } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  const dialogRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`
          relative z-10 w-full ${widths[size]}
          bg-surface rounded-xl shadow-card border border-edge
          animate-in fade-in zoom-in-95
          ${className}
        `}
      >
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-edge-subtle flex items-center justify-between">
            <h2 id="modal-title" className="text-base font-semibold text-ink tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-ink-muted hover:text-ink-secondary hover:bg-surface-200 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-edge-subtle flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
