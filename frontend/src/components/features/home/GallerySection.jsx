/*
  GallerySection — campus photo gallery for the Home page.
  Converted from friend's TS. Image assets → Unsplash placeholders.
  lucide-react → inline SVGs. Generic grays → design tokens.
*/

import React, { useState } from 'react';
import Skeleton from '../../common/Skeleton';

/* Inline SVGs */
const XIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
const CameraIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
  </svg>
);

const images = [
  { src: 'https://images.unsplash.com/photo-1523050854058-8df90110c5a1?w=600', title: 'Student Life', description: 'Students collaborating on projects', category: 'Students' },
  { src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600', title: 'Academic Excellence', description: 'Professor engaging with students', category: 'Faculty' },
  { src: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=600', title: 'Proud Moments', description: 'Graduation celebration', category: 'Graduation' },
  { src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600', title: 'Campus Life', description: 'Campus and courtyard', category: 'Campus' },
];

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState([false, false, false, false]);

  const handleImageLoad = (index) => {
    setImagesLoaded((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  return (
    <section className="py-20 bg-surface-200">
      <div className="container-custom">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-brand-light rounded-full px-4 py-2 mb-4">
            <CameraIcon className="w-4 h-4 text-brand mr-2" />
            <span className="text-sm font-medium text-brand">Our Gallery</span>
          </div>
          <h2 className="text-4xl font-bold text-ink tracking-tight">Campus Life</h2>
          <p className="text-ink-secondary mt-3 max-w-xl mx-auto">
            A glimpse into daily life at Ibn Khaldoun University.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {images.map((img, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden cursor-pointer border border-edge shadow-soft"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setSelectedImage(img.src)}
            >
              {!imagesLoaded[index] && <Skeleton className="w-full aspect-[4/3]" />}
              <img
                src={img.src}
                alt={img.title}
                className={`w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105 ${imagesLoaded[index] ? '' : 'sr-only'}`}
                loading="lazy"
                decoding="async"
                onLoad={() => handleImageLoad(index)}
              />
              <div className={`absolute inset-0 bg-ink/60 flex flex-col items-center justify-center text-white transition-opacity duration-200 ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-xs font-medium tracking-wide uppercase mb-1">{img.category}</span>
                <span className="text-base font-semibold">{img.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-surface-300 transition"
            onClick={() => setSelectedImage(null)}
            aria-label="Close lightbox"
          >
            <XIcon className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Gallery preview"
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </section>
  );
};

export default GallerySection;
