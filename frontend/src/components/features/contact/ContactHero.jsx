/*
  ContactHero — hero banner for the Contact page.
  Converted from friend's TS. Design-token-compliant.
*/

import React from 'react';

const contactBg = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1400';

const ContactHero = () => {
  return (
    <section className="relative h-[55vh] min-h-[360px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={contactBg} alt="Contact Us" className="w-full h-full object-cover" loading="eager" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/80 to-ink/70" />
      </div>

      <div className="relative z-10 text-center text-white px-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/10 border border-edge-strong backdrop-blur-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm tracking-wide">We are here to help</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">Contact Us</h1>
        <p className="text-lg md:text-2xl text-white/90">Get in touch with our university team</p>
      </div>
    </section>
  );
};

export default ContactHero;
