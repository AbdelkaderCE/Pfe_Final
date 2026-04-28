/*
  BannerSection — secondary CTA banner for the Home page.
  Converted from friend's TS. Uses design tokens, inline SVGs, no image import.
*/

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from '../../common/Skeleton';

const bannerBg = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1400';

const BannerSection = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {!imageLoaded && (
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      <div className={`absolute inset-0 transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <img
          src={bannerBg}
          alt="University Campus"
          className="w-full h-full object-cover"
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 container-custom py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="bg-black/10 backdrop-blur-[2px] p-8 rounded-xl text-white">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                Ibn Khaldoun University
              </span>
            </h2>
            <p className="text-xl mb-8 text-white/90 leading-relaxed">
              Established in 1980, our university is dedicated to excellence in education,
              research, and community service. Join over 28,000 students and 1,100 faculty
              members in our journey of knowledge and discovery.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="rounded-md border border-edge bg-surface px-8 py-3 font-medium text-ink transition-all duration-150 hover:shadow-card hover:bg-surface-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-canvas"
              >
                Apply Now
              </Link>
              <Link
                to="/about"
                className="rounded-md border border-edge-strong bg-surface/10 px-8 py-3 font-medium text-surface transition-all duration-150 hover:bg-surface hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-canvas"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerSection;
