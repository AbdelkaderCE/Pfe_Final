/*
  ContactInfo — contact details card for the Contact page.
  Converted from friend's TS. lucide-react → inline SVGs, tokens applied.
*/

import React from 'react';

/* Inline SVG icons (stroke 1.5) */
const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const info = [
  { Icon: MapPinIcon, label: 'Address', value: 'BP 78, Tiaret 14000, Algeria' },
  { Icon: PhoneIcon, label: 'Phone', value: '+213 555 55 55 55' },
  { Icon: MailIcon, label: 'Email', value: 'info@univ-tiaret.dz' },
  { Icon: ClockIcon, label: 'Hours', value: 'Sun–Thu, 8 AM – 5 PM' },
];

const ContactInfo = () => {
  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card p-8">
      <h2 className="text-xl font-bold text-ink mb-6 tracking-tight">Contact Information</h2>

      <div className="space-y-6">
        {info.map((item, index) => {
          const { Icon } = item;
          return (
            <div key={index} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-surface-200 rounded-lg flex items-center justify-center text-ink-secondary shrink-0">
                <Icon />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">{item.label}</h3>
                <p className="text-sm text-ink-secondary">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContactInfo;
