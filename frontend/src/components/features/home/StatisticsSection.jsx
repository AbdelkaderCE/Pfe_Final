/*
  StatisticsSection — animated counter stats for the Home page.
  Converted from friend's TS. lucide-react → inline SVGs, generic grays → tokens.
*/

import React, { useEffect, useState, useRef } from 'react';

/* Inline SVG icons (stroke 1.5) */
const iconPaths = {
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  bookOpen: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
  award: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>,
  building: <><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></>,
};

const Icon = ({ name, className = 'w-8 h-8' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {iconPaths[name]}
  </svg>
);

const stats = [
  { icon: 'users', value: 2500, label: 'Active Students', suffix: '+' },
  { icon: 'bookOpen', value: 150, label: 'Expert Teachers', suffix: '+' },
  { icon: 'award', value: 500, label: 'Projects Completed', suffix: '+' },
  { icon: 'building', value: 98, label: 'Satisfaction Rate', suffix: '%' },
];

/* Animated counter hook */
const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <span>
      {count.toLocaleString('fr-DZ')}
      {suffix}
    </span>
  );
};

const StatisticsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-canvas">
      <div className="container-custom">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-ink mb-4 tracking-tight">By the Numbers</h2>
          <p className="text-lg text-ink-secondary">Our growing academic community</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-surface border border-edge rounded-lg p-8 text-center shadow-soft hover:shadow-card transition-all"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-brand-light text-brand flex items-center justify-center">
                <Icon name={stat.icon} />
              </div>
              <div className="text-3xl font-bold text-ink mb-1">
                {isVisible ? <Counter end={stat.value} suffix={stat.suffix} /> : `0${stat.suffix}`}
              </div>
              <div className="text-sm text-ink-secondary">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
