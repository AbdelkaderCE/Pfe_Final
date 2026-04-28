/*
  AboutHero — hero banner for the About page.
  Converted from friend's TS. Design-token-compliant.
*/

import React from 'react';

const aboutBg = 'https://images.unsplash.com/photo-1562774053-701939374585?w=1400';

const AboutHero = () => {
  return (
    <section className="relative h-[65vh] min-h-[420px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={aboutBg}
          alt="About University"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/80 to-ink/70" />
      </div>

      <div className="relative z-10 text-center text-white px-4 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/10 border border-edge-strong backdrop-blur-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm tracking-wide">Founded 1980 · Tiaret, Algeria</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
          About <span className="text-white/90">Ibn Khaldoun</span>
        </h1>

        <p className="text-lg md:text-2xl text-white/90 leading-relaxed">
          Discover the story, mission, and values of a university dedicated to excellence
          in education, innovation, and community impact.
        </p>
      </div>
    </section>
  );
};

export default AboutHero;
