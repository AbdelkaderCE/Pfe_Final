/*
  Card — standard container for module data.
  Depth: shadow-card + border-edge. Same approach everywhere for surface consistency.
  Padding: 24px (lg) default. Header/footer separated by border-edge-subtle.
  Corner radius: md (8px). Not too sharp (technical), not too round (playful).
*/

import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-surface rounded-lg shadow-card border border-edge ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 border-b border-edge-subtle ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', as: Tag = 'h3', ...props }) {
  return (
    <Tag className={`text-base font-semibold text-ink tracking-tight ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`mt-1 text-sm text-ink-tertiary ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 border-t border-edge-subtle flex items-center gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
