/*
  FeaturesSection — platform features grid for the Home page.
  Converted from friend's TS. lucide-react → inline SVGs, generic grays → tokens.
*/

import React, { useState } from 'react';

/* Inline SVG icons (stroke 1.5) — only 8 unique icons needed */
const icons = {
  users: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  bookOpen: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  ),
  graduationCap: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 4 3 6 3s6-2 6-3v-5"/></svg>
  ),
  fileText: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
  ),
  clock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  shield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C8.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
  ),
  zap: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
  ),
  globe: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
  ),
};

const features = [
  { icon: 'users', title: 'Student Portal', description: 'Access grades, projects, complaints, and communicate with teachers in one place.', stats: '2,500+ active students' },
  { icon: 'bookOpen', title: 'Course Management', description: 'Powerful tools for creating, organizing, and delivering course content.', stats: '150+ courses' },
  { icon: 'graduationCap', title: 'Graduation Projects', description: 'End-to-end PFE project management from proposal to final defense.', stats: '500+ projects' },
  { icon: 'fileText', title: 'Disciplinary Committee', description: 'Streamlined case management for fair and transparent resolutions.', stats: '95% resolution rate' },
  { icon: 'clock', title: 'Real-time Updates', description: 'Instant notifications for grades, announcements, and important deadlines.', stats: 'Instant delivery' },
  { icon: 'shield', title: 'Role-based Security', description: 'Ten distinct roles ensure every user sees only what they need.', stats: '10 roles' },
  { icon: 'zap', title: 'Fast & Responsive', description: 'Optimized for speed — works on any device, any connection.', stats: '<2s load time' },
  { icon: 'globe', title: 'Multi-language', description: 'Support for Arabic, French, and English across the platform.', stats: '3 languages' },
];

const FeaturesSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <section className="py-20 bg-canvas">
      <div className="container-custom">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-ink mb-4 tracking-tight">
            Everything You Need
          </h2>
          <p className="text-lg text-ink-secondary max-w-2xl mx-auto">
            A comprehensive platform designed for every member of the academic community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`bg-surface border border-edge rounded-lg p-6 transition-all duration-200 cursor-default ${
                hoveredIndex === index ? 'shadow-card -translate-y-1' : 'shadow-soft'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="w-12 h-12 rounded-lg bg-brand-light text-brand flex items-center justify-center mb-4">
                {icons[feature.icon]}
              </div>
              <h3 className="text-base font-semibold text-ink mb-2">{feature.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed mb-3">{feature.description}</p>
              <span className="text-xs font-medium text-brand">{feature.stats}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
