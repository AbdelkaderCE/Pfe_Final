/*
  HeroSection — main hero banner for the Home page.
  Converted from friend's TS. lucide-react → inline SVGs, tokens applied.
  Image import removed (asset doesn't exist in our tree yet) — uses placeholder.
*/

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from '../../common/Skeleton';

/* Inline SVG icons (stroke 1.5) */
const GraduationCapIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 4 3 6 3s6-2 6-3v-5"/>
  </svg>
);
const UsersIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const BookOpenIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const ArrowRightIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);

const heroBg = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1400';

const HeroSection = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Skeleton Loader */}
      {!imageLoaded && (
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      {/* Background Image */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <img
          src={heroBg}
          alt="University Background"
          className="w-full h-full object-cover"
          onLoad={() => setImageLoaded(true)}
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Floating decorative icons */}
      {imageLoaded && (
        <>
          <div className="absolute top-20 left-10 animate-float">
            <GraduationCapIcon className="w-16 h-16 text-white/30" />
          </div>
          <div className="absolute bottom-20 right-10 animate-float delay-500">
            <UsersIcon className="w-20 h-20 text-white/30" />
          </div>
          <div className="absolute top-40 right-20 animate-float delay-1000">
            <BookOpenIcon className="w-12 h-12 text-white/30" />
          </div>
        </>
      )}

      {/* Content */}
      <div className="relative z-10 container-custom text-center text-white py-20">
        <div className="inline-flex items-center rounded-full border border-edge-strong bg-surface/20 px-4 py-2 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
          <span className="text-sm font-medium">University Platform 2026</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
          <span className="block">Ibn Khaldoun</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
            University
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
          A complete digital platform for pedagogical activities — grades, projects,
          attendance, disciplinary management, and more.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-brand text-white px-8 py-3 rounded-md font-medium hover:bg-brand-hover transition-all duration-150 shadow-card"
          >
            Get Started <ArrowRightIcon className="w-4 h-4" />
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 rounded-md border border-edge-strong bg-surface/10 px-8 py-3 font-medium text-surface transition-all duration-150 hover:bg-surface hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-canvas"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
