import React, { useEffect, useState } from 'react';
import request from '../../services/api';

/**
 * UTILITIES
 */
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

/**
 * ICON COMPONENTS
 */
function IconChevron({ direction = 'left' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`h-4 w-4 ${direction === 'right' ? 'rotate-180' : ''}`} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * URGENT ANNOUNCEMENTS CAROUSEL - MODERN STAGE VARIATION
 */
function UrgentCarouselHome({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  const current = items[currentIndex];

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Unified Slider Container */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          margin: '0 auto',
          minHeight: '320px',
          background: 'var(--color-canvas)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Left Arrow */}
        <button
          onClick={goToPrev}
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 40,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            transition: 'all 150ms ease-out',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            padding: 0,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-brand)';
            e.currentTarget.style.background = 'var(--color-brand)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
          }}
          aria-label="Previous announcement"
        >
          <IconChevron direction="left" />
        </button>

        {/* Slider Track */}
        <div 
          style={{
            position: 'relative',
            width: '100%',
            paddingLeft: '72px',
            paddingRight: '72px',
            paddingTop: '32px',
            paddingBottom: '32px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Active Card */}
          <div 
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: '12px',
              border: '1px solid var(--color-edge-subtle)',
              background: 'var(--color-surface)',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              transform: 'scale(1)',
              opacity: 1,
              zIndex: 20,
              transition: 'all 300ms ease-out',
              minHeight: '280px',
            }}
          >
            {/* Left accent bar */}
            <div 
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                background: 'var(--status-error, #dc2626)',
                borderRadius: '12px 0 0 12px',
              }}
            />

            {/* Card Content */}
            <div 
              style={{
                position: 'relative',
                zIndex: 2,
                padding: '32px',
                paddingLeft: '40px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '6px',
                    border: '1px solid var(--status-error, #dc2626)',
                    background: 'rgba(220, 38, 38, 0.1)',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--status-error, #dc2626)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Urgent
                </span>
              </div>

              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--color-ink)',
                marginBottom: '12px',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {getTitle(current)}
              </h2>

              <p style={{ 
                fontSize: '13px', 
                color: 'var(--color-ink-secondary)',
                marginBottom: '16px',
              }}>
                {getCategoryName(current)} • {formatDate(current?.datePublication || current?.createdAt)}
              </p>

              <p style={{ 
                fontSize: '15px', 
                color: 'var(--color-ink-secondary)',
                marginBottom: '20px',
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {getContent(current)}
              </p>

              <a 
                href={`/actualites#${current.id}`} 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-brand)',
                  textDecoration: 'none',
                  transition: 'all 200ms ease-out',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-brand-hover)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-brand)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                Read more 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={goToNext}
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 40,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            transition: 'all 150ms ease-out',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            padding: 0,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-brand)';
            e.currentTarget.style.background = 'var(--color-brand)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
          }}
          aria-label="Next announcement"
        >
          <IconChevron direction="right" />
        </button>
      </div>

      {/* Indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingTop: '24px' }}>
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              height: '8px',
              width: idx === currentIndex ? '32px' : '8px',
              borderRadius: '4px',
              background: idx === currentIndex ? 'var(--color-brand)' : 'var(--color-edge)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 200ms ease-out',
              boxShadow: idx === currentIndex ? '0 2px 8px rgba(var(--color-brand-rgb, 0, 0, 0), 0.3)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (idx !== currentIndex) {
                e.currentTarget.style.background = 'var(--color-edge-strong)';
                e.currentTarget.style.transform = 'scale(1.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (idx !== currentIndex) {
                e.currentTarget.style.background = 'var(--color-edge)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            aria-label={`Go to announcement ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * FEED CARD - Horizontal announcement row for feed display
 */
function FeedCard({ item, isAdmin = false }) {
  const urgent = isImportantAnnouncement(item);
  const dateValue = item?.datePublication || item?.createdAt;
  const displayDate = formatDate(dateValue);

  return (
    <div
      style={{
        borderBottom: '1px solid var(--color-edge-subtle)',
        background: 'var(--color-surface)',
        transition: 'all 150ms ease-out',
        cursor: 'pointer',
        padding: '16px 0',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-surface-200)';
        e.currentTarget.style.borderColor = 'var(--color-edge-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--color-surface)';
        e.currentTarget.style.borderColor = 'var(--color-edge-subtle)';
      }}
    >
      {/* 3-Column Layout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Column 1: Category Badge */}
        <div style={{ flex: '0 0 120px', minWidth: 0 }}>
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'var(--color-brand-light)',
              color: 'var(--color-brand)',
              border: '1px solid var(--color-brand)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {getCategoryName(item)}
          </span>
        </div>

        {/* Column 2: Title + Snippet */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--color-ink)',
            marginBottom: '4px',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {getTitle(item)}
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'var(--color-ink-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {getContent(item)}
          </p>
        </div>

        {/* Column 3: Metadata + Status */}
        <div style={{ flex: '0 0 120px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-ink-secondary)' }}>
            {displayDate}
          </div>
          {urgent && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid var(--status-error, #dc2626)',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--status-error, #dc2626)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * MAIN NEWS INTEGRATION SECTION
 */
export default function NewsIntegrationSection() {
  const [announcements, setAnnouncements] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await request('/api/v1/annonces');
        const data = Array.isArray(response?.data) ? response.data.slice(0, 10) : [];
        setAnnouncements(data);

        // Group by category for quick access
        const categoryMap = {};
        data.forEach(item => {
          const cat = getCategoryName(item);
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });
        setCategories(categoryMap);
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const urgentAnnouncements = announcements.filter(isImportantAnnouncement);
  const regularAnnouncements = announcements.filter(item => !isImportantAnnouncement(item));

  return (
    <section style={{ paddingTop: '48px', paddingBottom: '48px', background: 'var(--color-canvas)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingLeft: '16px', paddingRight: '16px' }}>
        {/* Section Header */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, tracking: '-0.02em', color: 'var(--color-ink)', marginBottom: '16px' }}>
            Latest News & Announcements
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--color-ink-secondary)' }}>
            Stay informed with the most important updates from our institution
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
            <div style={{ color: 'var(--color-ink-secondary)' }}>Loading announcements...</div>
          </div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
            <p style={{ color: 'var(--color-ink-secondary)' }}>No announcements at this time</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* LEFT COLUMN (70% equivalent): Feed */}
            <div style={{ gridColumn: '1 / -1' }}>
              {/* Urgent Carousel */}
              {urgentAnnouncements.length > 0 && (
                <UrgentCarouselHome items={urgentAnnouncements} />
              )}

              {/* Regular Feed */}
              <div style={{
                borderRadius: '12px',
                border: '1px solid var(--color-edge-subtle)',
                background: 'var(--color-surface)',
                overflow: 'hidden',
              }}>
                {regularAnnouncements.slice(0, 4).map((item) => (
                  <a
                    key={item.id}
                    href={`/actualites#${item.id}`}
                    style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}
                  >
                    <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
                      <FeedCard item={item} />
                    </div>
                  </a>
                ))}
              </div>

              {/* View All Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                <a
                  href="/actualites"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '2px solid var(--color-brand)',
                    background: 'transparent',
                    color: 'var(--color-brand)',
                    textDecoration: 'none',
                    transition: 'all 200ms ease-out',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-brand)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-brand)';
                  }}
                >
                  View All Announcements
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* RIGHT COLUMN (30% equivalent): Quick Access */}
            <div style={{
              borderRadius: '12px',
              border: '1px solid var(--color-edge-subtle)',
              background: 'var(--color-surface)',
              padding: '24px',
              display: 'none', // Hidden on initial layout - can be enabled for wider screens
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '16px' }}>
                Quick Access
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(categories).map(([category, count]) => (
                  <a
                    key={category}
                    href={`/actualites?category=${encodeURIComponent(category)}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-edge)',
                      background: 'var(--color-canvas)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 150ms ease-out',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-brand)';
                      e.currentTarget.style.background = 'var(--color-brand-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-edge)';
                      e.currentTarget.style.background = 'var(--color-canvas)';
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink)' }}>
                      {category}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: 'var(--color-brand)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      {count}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </section>
  );
}
