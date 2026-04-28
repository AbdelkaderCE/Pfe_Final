/*
  MissionSection — mission / vision / values / commitment cards.
  Converted from friend's TS. lucide-react → inline SVGs, generic grays → tokens.
*/

import React from 'react';

/* Inline SVG icons (stroke 1.5) */
const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
);
const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C8.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
  </svg>
);

const items = [
  { Icon: TargetIcon, title: 'Our Mission', description: 'Deliver quality education that prepares students for professional success.' },
  { Icon: EyeIcon, title: 'Our Vision', description: 'Be a leading institution in higher education and research.' },
  { Icon: HeartIcon, title: 'Our Values', description: 'Excellence, integrity, innovation, diversity.' },
  { Icon: ShieldIcon, title: 'Our Commitment', description: 'Foster an inclusive and supportive environment for all.' },
];

const MissionSection = () => {
  return (
    <section className="py-20 bg-surface-200">
      <div className="container-custom">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-ink mb-4 tracking-tight">
            Mission &amp; Values
          </h2>
          <p className="text-lg text-ink-secondary">Committed to academic excellence since 1980</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => {
            const { Icon } = item;
            return (
              <div
                key={index}
                className="bg-surface rounded-xl p-8 shadow-soft border border-edge hover:shadow-card transition-all"
              >
                <div className="w-14 h-14 rounded-lg bg-brand text-white flex items-center justify-center mb-6">
                  <Icon />
                </div>
                <h3 className="text-xl font-semibold text-ink mb-3">{item.title}</h3>
                <p className="text-ink-secondary text-sm leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
