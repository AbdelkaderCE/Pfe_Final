import React, { useEffect, useState } from 'react';
import request from '../../services/api';

// Bounce animation style
const bounceStyle = `
  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    50% {
      opacity: 1;
      transform: scale(1.02);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  .bounce-in {
    animation: bounceIn 0.5s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = bounceStyle;
  document.head.appendChild(styleSheet);
}

/**
 * URGENT CAROUSEL
 * Full-width carousel component for urgent announcements
 */
function UrgentCarousel({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  const current = items[currentIndex];

  return (
    <div className="mb-12 rounded-lg border border-edge bg-surface overflow-visible">
      {/* Header */}
      <div className="flex h-12 items-center gap-3 px-6 bg-danger text-white rounded-t-lg">
        <svg className="h-5 w-5 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-semibold">URGENT ANNOUNCEMENTS</span>
      </div>

      {/* Carousel Content */}
      <div className="relative min-h-32 p-4 md:p-6 px-14 md:px-20">
        {/* Current Announcement */}
        <div className="pr-12 md:pr-16 transition-opacity duration-300 ease-in-out">
          <div className="flex items-start gap-2 mb-2">
            <span className="rounded-full border border-edge-strong bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">URGENT</span>
            <span className="inline-flex h-2 w-2 rounded-full bg-danger animate-pulse flex-shrink-0 mt-1.5" />
          </div>
          <h2 className="text-lg font-bold text-ink mb-1 line-clamp-2">{getTitle(current)}</h2>
          <p className="text-xs text-ink-secondary mb-2">{getCategoryName(current)} • {formatDate(current?.datePublication || current?.createdAt)}</p>
          <p className="text-sm text-ink-secondary mb-3 line-clamp-2">{getContent(current)}</p>
          <a href="/news" className="inline-flex items-center text-xs font-semibold text-brand hover:text-brand-hover transition-colors">
            Read more →
          </a>
        </div>

        {/* Navigation Buttons - Positioned Outside */}
        <button
          onClick={goToPrev}
          className="absolute top-1/2 -left-6 -translate-y-1/2 rounded-full border border-edge bg-surface p-2 text-ink-secondary hover:bg-surface-100 transition-all duration-200"
          aria-label="Previous announcement"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={goToNext}
          className="absolute top-1/2 -right-6 -translate-y-1/2 rounded-full border border-edge bg-surface p-2 text-ink-secondary hover:bg-surface-100 transition-all duration-200"
          aria-label="Next announcement"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 rotate-180" aria-hidden="true">
            <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Indicator Dots */}
      <div className="flex justify-center gap-2 pb-4">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 w-2 rounded-full transition-all ${
              idx === currentIndex ? 'bg-brand w-6' : 'bg-edge hover:bg-edge-strong'
            }`}
            aria-label={`Go to announcement ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

const resolveDisplayText = (ar, en, fallback = '') => {
  if (typeof en === 'string' && en.trim()) return en.trim();
  if (typeof ar === 'string' && ar.trim()) return ar.trim();
  return fallback;
};

const normalizePriority = (item) => String(item?.priority ?? item?.priorite ?? '').toLowerCase();
const isImportantAnnouncement = (item) => ['urgent', 'urgente', 'high', 'haute'].includes(normalizePriority(item));

const getTitle = (item) => resolveDisplayText(item?.titre_ar, item?.titre_en, 'Untitled');
const getContent = (item) => resolveDisplayText(item?.contenu_ar, item?.contenu_en, '');
const getCategoryName = (item) => resolveDisplayText(item?.type?.nom_ar, item?.type?.nom_en, 'General');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await request('/api/v1/annonces');
        const data = Array.isArray(response?.data) ? response.data.slice(0, 6) : [];
        setAnnouncements(data);
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const urgentAnnouncements = announcements.filter(isImportantAnnouncement);

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-canvas">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Latest Announcements
          </h2>
          <p className="mt-4 text-lg text-ink-secondary">
            Stay informed with important updates from the university
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-ink-secondary">Loading announcements...</div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-ink-secondary">No announcements yet</p>
          </div>
        ) : (
          <>
            {/* Urgent Announcements Carousel */}
            {urgentAnnouncements.length > 0 && (
              <UrgentCarousel items={urgentAnnouncements} />
            )}

            {/* All Announcements Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {announcements.slice(0, 6).map((item) => (
                <a
                  key={item.id}
                  href="/news"
                  className="rounded-lg border border-edge bg-surface p-6 shadow-card hover:shadow-card transition-all duration-150"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="rounded-full border border-edge bg-surface-200 px-2 py-0.5 text-xs font-semibold text-brand uppercase">
                      {getCategoryName(item)}
                    </span>
                    {isImportantAnnouncement(item) && (
                      <span className="inline-flex h-2 w-2 rounded-full bg-danger animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-ink line-clamp-2 mb-2">{getTitle(item)}</h3>
                  <p className="text-xs text-ink-tertiary mb-3">{formatDate(item?.datePublication || item?.createdAt)}</p>
                  <p className="text-sm text-ink-secondary line-clamp-3 mb-4">{getContent(item)}</p>
                  <span className="text-brand text-sm font-semibold">Read more →</span>
                </a>
              ))}
            </div>

            {/* View All Button */}
            <div className="mt-12 text-center">
              <a
                href="/news"
                className="inline-flex items-center justify-center rounded-md bg-brand px-6 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-hover"
              >
                View All Announcements →
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
