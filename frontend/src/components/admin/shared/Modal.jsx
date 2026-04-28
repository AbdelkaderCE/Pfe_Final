import React, { useEffect } from "react";

// Bounce animation style
const bounceStyle = `
  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    50% {
      opacity: 1;
      transform: scale(1.02);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  .bounce-in {
    animation: bounceIn 0.5s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = bounceStyle;
  document.head.appendChild(styleSheet);
}

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  maxWidth = "max-w-2xl",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={`max-h-[90vh] w-full ${maxWidth} overflow-hidden rounded-2xl border border-edge bg-surface shadow-card bounce-in`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-edge-subtle px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-ink">{title}</h3>
                {description ? <p className="mt-1 text-sm text-ink-tertiary">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-edge px-2 py-1 text-sm text-ink-tertiary hover:bg-surface-200 hover:text-ink"
              >
                Close
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-5 py-4">{children}</div>

          {footer ? (
            <div className="border-t border-edge-subtle bg-surface-200/40 px-5 py-4">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
