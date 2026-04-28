import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import studentsGroup from '../../assets/images/Students.jpg';
import student1 from '../../assets/images/student1.jpg';
import student2 from '../../assets/images/student2.jpg';
import prof from '../../assets/images/prof.jpg';

/* Inline SVG icons */
const CameraIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
  </svg>
);
const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const images = [
  {
    src: studentsGroup,
    titleKey: 'gallery.studentLife',
    descKey: 'gallery.studentLifeDesc',
    category: 'Students',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    src: student1,
    titleKey: 'gallery.academicExcellence',
    descKey: 'gallery.academicExcellenceDesc',
    category: 'Faculty',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    src: student2,
    titleKey: 'gallery.proudMoments',
    descKey: 'gallery.proudMomentsDesc',
    category: 'Graduation',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    src: prof,
    titleKey: 'gallery.campusLife',
    descKey: 'gallery.campusLifeDesc',
    category: 'Campus',
    gradient: 'from-purple-500 to-pink-500',
  },
];

export default function GallerySection() {
  const [selectedImage, setSelectedImage] = useState(null);
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-surface-200 dark:bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-brand-light rounded-full px-4 py-2 mb-4">
            <CameraIcon className="w-4 h-4 text-brand mr-2" />
            <span className="text-sm font-medium text-brand">{t('gallery.badge')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">{t('gallery.title')}</h2>
          <p className="text-xl text-ink-secondary max-w-2xl mx-auto">
            {t('gallery.subtitle')}
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-lg shadow-card cursor-pointer"
              onClick={() => setSelectedImage(image.src)}
            >
              <img
                src={image.src}
                alt={t(image.titleKey)}
                className="w-full h-80 object-cover transition-transform duration-200 group-hover:scale-105"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-200">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-gradient-to-r ${image.gradient}`}
                  >
                    {image.category}
                  </span>
                  <h3 className="text-xl font-bold mb-2">{t(image.titleKey)}</h3>
                  <p className="text-sm text-white/80 mb-4">{t(image.descKey)}</p>
                  <span className="flex items-center text-sm font-semibold">
                    {t('common.viewImage')}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-white/70 transition-colors duration-150 z-10"
              onClick={() => setSelectedImage(null)}
            >
              <XIcon className="w-8 h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </section>
  );
}
