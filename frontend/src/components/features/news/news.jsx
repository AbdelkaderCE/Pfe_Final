import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import request, { resolveMediaUrl } from '../../../services/api';

const injectedStyles = `
  @keyframes newsBounceIn {
    0% { opacity: 0; transform: translateY(10px) scale(0.97); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes newsSlideDown {
    0% { opacity: 0; transform: translateY(-8px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes newsPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.45); opacity: 0.55; }
  }

  .news-bounce-in { animation: newsBounceIn 220ms ease-out; }
  .news-slide-down { animation: newsSlideDown 220ms ease-out; }
  .news-hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
  .news-hide-scrollbar::-webkit-scrollbar { display: none; }
`;

const categories = [
  { name: 'All', value: '' },
  { name: 'Administrative', value: 'Administrative' },
  { name: 'Academic', value: 'Academic' },
  { name: 'Events', value: 'Events' },
  { name: 'Research', value: 'Research' },
  { name: 'Student Life', value: 'Student Life' },
];

const ANNOUNCEMENT_PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
  { value: 'high', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
];

const inputClassName =
  'w-full rounded-md border border-control-border bg-control-bg px-3 py-2.5 text-sm text-ink outline-none transition-all duration-150 placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50';

function useIsMobile(breakpoint = 640) {
  const getCurrentValue = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  };

  const [isMobile, setIsMobile] = useState(getCurrentValue);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const updateValue = () => setIsMobile(mediaQuery.matches);

    updateValue();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateValue);
      return () => mediaQuery.removeEventListener('change', updateValue);
    }

    mediaQuery.addListener(updateValue);
    return () => mediaQuery.removeListener(updateValue);
  }, [breakpoint]);

  return isMobile;
}

function injectNewsStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('news-professional-mobile-styles')) return;

  const style = document.createElement('style');
  style.id = 'news-professional-mobile-styles';
  style.textContent = injectedStyles;
  document.head.appendChild(style);
}

const resolveDisplayText = (ar, en, fallback = '') => {
  if (typeof en === 'string' && en.trim()) return en.trim();
  if (typeof ar === 'string' && ar.trim()) return ar.trim();
  return fallback;
};

const normalizePriority = (item) => String(item?.priority ?? item?.priorite ?? '').toLowerCase();
const isImportantAnnouncement = (item) => ['urgent', 'urgente', 'high', 'haute'].includes(normalizePriority(item));

const getCategoryName = (item) => resolveDisplayText(item?.type?.nom_ar, item?.type?.nom_en, 'General');
const getTitle = (item) => resolveDisplayText(item?.titre_ar, item?.titre_en, 'Untitled announcement');
const getContent = (item) => resolveDisplayText(item?.contenu_ar, item?.contenu_en, '');

const getTargetLabel = (item) => {
  const target = String(item?.cible ?? item?.target ?? 'tous').toLowerCase();

  if (target === 'etudiants' || target === 'students') return 'Students';
  if (target === 'enseignants' || target === 'teachers') return 'Teachers';
  if (target === 'administration' || target === 'admin' || target === 'administrators') return 'Administration';

  return 'Everyone';
};


const normalizeFilterKey = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const getCategoryFilterKey = (item) => normalizeFilterKey(getCategoryName(item));

const formatDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

function IconChevron({ direction = 'left' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`h-4 w-4 ${direction === 'right' ? 'rotate-180' : ''}`} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="10" cy="5" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconFile({ className = 'h-4 w-4', color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 2v16h10V7.5L12.5 2H5Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12.5 2v5.5H15.5" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="7" y1="10" x2="13" y2="10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7" y1="13" x2="13" y2="13" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function getFileTypeFlags(filePath = '') {
  const value = String(filePath || '').toLowerCase();

  return {
    isImage: /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(value),
    isVideo: /\.(mp4|mov|avi|webm|mkv|mpeg|wmv|ogv|3gp|flv)$/i.test(value),
    isPdf: /\.pdf$/i.test(value),
  };
}

function AttachmentPreviewCard({ doc, isMobile = false }) {
  const attachmentUrl = doc?.fichier ? resolveMediaUrl(doc.fichier) : '';
  if (!attachmentUrl) return null;

  const { isImage, isVideo, isPdf } = getFileTypeFlags(doc?.fichier);

  return (
    <a
      href={attachmentUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isMobile ? '10px' : '12px',
        marginTop: '10px',
        padding: isMobile ? '9px' : '10px',
        borderRadius: '14px',
        border: '1px solid var(--color-edge)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
        textDecoration: 'none',
        width: isMobile ? '100%' : 'fit-content',
        maxWidth: isMobile ? '100%' : '320px',
        overflow: 'hidden',
        boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
      }}
    >
      <div
        style={{
          width: isMobile ? '50px' : '54px',
          height: isMobile ? '50px' : '54px',
          borderRadius: '11px',
          border: '1px solid var(--color-edge)',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
          background: 'linear-gradient(135deg, #1e2433, #0f172a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isImage ? (
          <img
            src={attachmentUrl}
            alt={doc?.nomDocument || 'Attachment preview'}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : isVideo ? (
          <>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white" style={{ opacity: 0.95 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
            <span
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                background: 'rgba(0,0,0,0.72)',
                borderRadius: '4px',
                padding: '2px 4px',
                fontSize: '9px',
                color: 'white',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              VIDEO
            </span>
          </>
        ) : isPdf ? (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                background: '#dc2626',
                borderRadius: '4px',
                padding: '2px 4px',
                fontSize: '9px',
                color: 'white',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              PDF
            </span>
          </>
        ) : (
          <IconFile className="h-6 w-6" color="white" />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '4px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--color-ink)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: isMobile ? 'calc(100vw - 130px)' : '210px',
          }}
        >
          {doc?.nomDocument || doc?.fichier?.split('/').pop() || 'Attachment'}
        </span>

        <span style={{ fontSize: '11px', color: 'var(--color-ink-secondary)', whiteSpace: 'nowrap' }}>
          {isImage ? 'Open image' : isVideo ? 'Play video' : isPdf ? 'Open PDF' : 'Open file'}
        </span>
      </div>
    </a>
  );
}

function UrgentAnnouncementsCarousel({ items, isMobile }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= items.length) setCurrentIndex(0);
  }, [currentIndex, items.length]);

  if (!items.length) return null;

  const current = items[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  return (
    <section style={{ marginBottom: isMobile ? '18px' : '24px' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: isMobile ? '260px' : '320px',
          background: 'var(--color-canvas)',
          borderRadius: isMobile ? '18px' : '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {!isMobile && items.length > 1 ? (
          <button
            type="button"
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
              color: 'var(--color-brand)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              padding: 0,
            }}
            aria-label="Previous announcement"
          >
            <IconChevron direction="left" />
          </button>
        ) : null}

        <article
          style={{
            position: 'relative',
            width: '100%',
            margin: isMobile ? 0 : '0 72px',
            borderRadius: isMobile ? '18px' : '14px',
            border: '1px solid var(--color-edge-subtle)',
            background: 'linear-gradient(180deg, var(--color-surface), var(--color-surface-200))',
            overflow: 'hidden',
            boxShadow: isMobile ? '0 10px 28px rgba(0, 0, 0, 0.12)' : '0 12px 34px rgba(0, 0, 0, 0.14)',
            minHeight: isMobile ? '250px' : '280px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: isMobile ? '5px' : '4px',
              background: 'var(--status-error, #dc2626)',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              padding: isMobile ? '20px 18px 18px 22px' : '32px 32px 32px 40px',
              minHeight: isMobile ? '250px' : '280px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isMobile ? '14px' : '16px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    borderRadius: '999px',
                    border: '1px solid var(--status-error, #dc2626)',
                    background: 'rgba(220, 38, 38, 0.1)',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--status-error, #dc2626)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Urgent
                </span>

                <span style={{ fontSize: '12px', color: 'var(--color-ink-tertiary)', fontWeight: 500 }}>
                  {currentIndex + 1} / {items.length}
                </span>
              </div>

              <h2
                style={{
                  fontSize: isMobile ? '20px' : '26px',
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  color: 'var(--color-ink)',
                  margin: 0,
                  marginBottom: '10px',
                  lineHeight: 1.25,
                  display: '-webkit-box',
                  WebkitLineClamp: isMobile ? 3 : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {getTitle(current)}
              </h2>

              <p
                style={{
                  fontSize: isMobile ? '12px' : '13px',
                  color: 'var(--color-ink-secondary)',
                  margin: 0,
                  marginBottom: isMobile ? '14px' : '16px',
                }}
              >
                {getCategoryName(current)} • {formatDate(current?.datePublication || current?.createdAt)}
              </p>

              <p
                style={{
                  fontSize: isMobile ? '14px' : '15px',
                  color: 'var(--color-ink-secondary)',
                  margin: 0,
                  lineHeight: 1.65,
                  display: '-webkit-box',
                  WebkitLineClamp: isMobile ? 4 : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {getContent(current)}
              </p>
            </div>

            {isMobile && items.length > 1 ? (
              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button
                  type="button"
                  onClick={goToPrev}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-edge)',
                    background: 'var(--color-canvas)',
                    color: 'var(--color-ink-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  aria-label="Previous announcement"
                >
                  <IconChevron direction="left" />
                </button>

                <button
                  type="button"
                  onClick={goToNext}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-edge)',
                    background: 'var(--color-brand)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  aria-label="Next announcement"
                >
                  <IconChevron direction="right" />
                </button>
              </div>
            ) : null}
          </div>
        </article>

        {!isMobile && items.length > 1 ? (
          <button
            type="button"
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
              color: 'var(--color-brand)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              padding: 0,
            }}
            aria-label="Next announcement"
          >
            <IconChevron direction="right" />
          </button>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingTop: isMobile ? '16px' : '22px' }}>
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              style={{
                height: '8px',
                width: idx === currentIndex ? '30px' : '8px',
                borderRadius: '999px',
                background: idx === currentIndex ? 'var(--color-brand)' : 'var(--color-edge)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 180ms ease-out',
              }}
              aria-label={`Go to urgent announcement ${idx + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function EmptyUrgentState({ isMobile, isAdmin, onAdd }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: isMobile ? '16px' : '12px',
        border: '2px dashed var(--color-edge)',
        background: 'var(--color-surface)',
        padding: isMobile ? '34px 18px' : '56px 24px',
        textAlign: 'center',
      }}
    >
      {/* Admin: Add-news button anchored top-right of the empty state */}
      {isAdmin && (
        <button
          type="button"
          onClick={onAdd}
          title="Create a new announcement"
          aria-label="Add news"
          style={{
            position: 'absolute',
            top: isMobile ? '10px' : '12px',
            right: isMobile ? '10px' : '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '6px 10px' : '7px 12px',
            borderRadius: '999px',
            border: '1px solid var(--color-brand)',
            background: 'var(--color-brand)',
            color: 'var(--color-surface)',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px -4px rgba(0,0,0,0.25)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 16px -4px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px -4px rgba(0,0,0,0.25)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add News
        </button>
      )}

      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-tertiary)" strokeWidth="1.5" style={{ margin: '0 auto 14px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 4px' }}>No Urgent Announcements</p>
      <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', margin: 0 }}>Check back soon for important updates</p>
    </div>
  );
}

function AnnouncementActionsMenu({ item, isAdmin, openMenuId, setOpenMenuId, onEdit, onDelete, isMobile }) {
  if (!isAdmin) return null;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isMobile ? '34px' : '36px',
          height: isMobile ? '34px' : '36px',
          borderRadius: '10px',
          border: '1px solid var(--color-edge)',
          background: 'var(--color-canvas)',
          color: 'var(--color-ink-secondary)',
          cursor: 'pointer',
          padding: 0,
        }}
        aria-label="Announcement actions"
      >
        <IconMenu />
      </button>

      {openMenuId === item.id ? (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            width: '138px',
            borderRadius: '12px',
            border: '1px solid var(--color-edge)',
            background: 'var(--color-surface)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.16)',
            zIndex: 30,
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onEdit(item);
              setOpenMenuId(null);
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-ink-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => {
              onDelete(item.id);
              setOpenMenuId(null);
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--status-error, #dc2626)',
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid var(--color-edge-subtle)',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AnnouncementRow({
  item,
  isAdmin,
  onEdit,
  onDelete,
  openMenuId,
  setOpenMenuId,
  isExpanded,
  onToggleExpand,
  isMobile,
}) {
  const urgent = isImportantAnnouncement(item);
  const attachment = item?.documents?.[0];
  const displayDate = formatDate(item?.datePublication || item?.createdAt);
  const authorName = `${item?.auteur?.prenom || ''} ${item?.auteur?.nom || ''}`.trim() || 'Unknown';

  if (isMobile) {
    return (
      <article
        style={{
          position: 'relative',
          borderRadius: '16px',
          border: '1px solid var(--color-edge-subtle)',
          background: 'var(--color-surface)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: urgent ? 'var(--status-error, #dc2626)' : 'var(--status-info, #1d4ed8)',
          }}
        />

        <div style={{ padding: '16px 14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '999px',
                  border: '1px solid var(--color-edge)',
                  background: 'var(--color-canvas)',
                  padding: '5px 9px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-brand)',
                  maxWidth: '170px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {getCategoryName(item)}
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '999px',
                  border: '1px solid var(--color-edge-subtle)',
                  background: 'var(--color-surface-200)',
                  padding: '5px 9px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'var(--color-ink-tertiary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {getTargetLabel(item)}
              </span>

              {urgent ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    borderRadius: '999px',
                    background: 'rgba(220, 38, 38, 0.10)',
                    color: 'var(--status-error, #dc2626)',
                    padding: '5px 9px',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--status-error, #dc2626)',
                      animation: 'newsPulse 1.8s infinite',
                    }}
                  />
                  Urgent
                </span>
              ) : null}
            </div>

            <AnnouncementActionsMenu
              item={item}
              isAdmin={isAdmin}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onEdit={onEdit}
              onDelete={onDelete}
              isMobile={isMobile}
            />
          </div>

          <h3
            style={{
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '-0.015em',
              color: 'var(--color-ink)',
              margin: 0,
              marginBottom: '8px',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {getTitle(item)}
          </h3>

          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.55,
              color: 'var(--color-ink-secondary)',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {getContent(item)}
          </p>

          {attachment ? <AttachmentPreviewCard doc={attachment} isMobile={isMobile} /> : null}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-edge-subtle)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink-secondary)', margin: 0 }}>{displayDate}</p>
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--color-ink-tertiary)',
                  margin: '2px 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '180px',
                }}
              >
                By {authorName}
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleExpand}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1px solid var(--color-edge)',
                background: isExpanded ? 'var(--color-brand)' : 'var(--color-canvas)',
                color: isExpanded ? 'white' : 'var(--color-ink-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {isExpanded ? 'Close' : 'Details'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={isExpanded ? 'M6 9l6 6 6-6' : 'M9 18l6-6 6 6'} />
              </svg>
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div
      style={{
        borderBottom: '1px solid var(--color-edge-subtle)',
        background: 'var(--color-surface)',
        transition: 'all 150ms ease-out',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = 'var(--color-surface-200)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'var(--color-surface)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div
          style={{
            width: '3px',
            flexShrink: 0,
            background: urgent ? 'var(--status-error, #dc2626)' : 'var(--status-info, #1d4ed8)',
          }}
        />

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '160px minmax(0, 1fr) auto',
            alignItems: 'flex-start',
            gap: '18px',
            padding: '20px 24px',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '6px',
                border: '1px solid var(--color-edge)',
                background: 'var(--color-canvas)',
                padding: '5px 9px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-brand)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '140px',
              }}
            >
              {getCategoryName(item)}
            </span>

            {urgent ? (
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--status-error, #dc2626)',
                  animation: 'newsPulse 1.8s infinite',
                  flexShrink: 0,
                }}
                title="Urgent"
              />
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 750,
                letterSpacing: '-0.01em',
                color: 'var(--color-ink)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {getTitle(item)}
            </h3>

            <p
              style={{
                fontSize: '13px',
                lineHeight: 1.55,
                color: 'var(--color-ink-secondary)',
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {getContent(item)}
            </p>

            {attachment ? <AttachmentPreviewCard doc={attachment} isMobile={false} /> : null}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, fontSize: '12px', color: 'var(--color-ink-secondary)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', minWidth: 'fit-content' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{displayDate}</span>
              <span style={{ fontSize: '11px', color: 'var(--color-ink-tertiary)', whiteSpace: 'nowrap' }}>By {authorName}</span>
              <span style={{ fontSize: '11px', color: 'var(--color-brand)', fontWeight: 800, whiteSpace: 'nowrap' }}>{getTargetLabel(item)}</span>
            </div>

            <button
              type="button"
              onClick={onToggleExpand}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid var(--color-edge)',
                background: isExpanded ? 'var(--color-brand)' : 'var(--color-canvas)',
                color: isExpanded ? 'white' : 'var(--color-ink-secondary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title={isExpanded ? 'Close announcement' : 'Expand announcement'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={isExpanded ? 'M6 9l6 6 6-6' : 'M9 18l6-6 6 6'} />
              </svg>
            </button>

            <AnnouncementActionsMenu
              item={item}
              isAdmin={isAdmin}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onEdit={onEdit}
              onDelete={onDelete}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpandedAnnouncement({ item, onClose, isMobile }) {
  const documents = Array.isArray(item?.documents) ? item.documents : [];

  return (
    <div
      className="news-slide-down"
      style={{
        borderBottom: isMobile ? 'none' : '1px solid var(--color-edge-subtle)',
        background: 'var(--color-surface-200)',
        padding: isMobile ? '8px 14px 16px' : '14px 24px 24px',
        borderRadius: isMobile ? '0 0 16px 16px' : 0,
      }}
    >
      <div style={{ maxWidth: '100%', margin: '0 auto' }}>
        <div
          style={{
            marginBottom: '22px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            gap: '16px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 800,
                color: 'var(--color-ink)',
                margin: 0,
                marginBottom: '10px',
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
              }}
            >
              {getTitle(item)}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '999px',
                  border: '1px solid var(--color-edge)',
                  background: 'var(--color-canvas)',
                  padding: '5px 9px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-brand)',
                }}
              >
                {getCategoryName(item)}
              </span>

              <span style={{ fontSize: '13px', color: 'var(--color-ink-secondary)' }}>{formatDate(item?.datePublication || item?.createdAt)}</span>

              <span style={{ fontSize: '13px', color: 'var(--color-ink-secondary)' }}>
                By {`${item?.auteur?.prenom || ''} ${item?.auteur?.nom || ''}`.trim() || 'Unknown'}
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '999px',
                  border: '1px solid var(--color-edge)',
                  background: 'var(--color-canvas)',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--color-ink-secondary)',
                }}
              >
                {getTargetLabel(item)}
              </span>

              {isImportantAnnouncement(item) ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: 'var(--status-error, #dc2626)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Urgent
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: isMobile ? '100%' : '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--color-edge)',
              background: 'var(--color-canvas)',
              color: 'var(--color-ink-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0,
            }}
            aria-label="Close announcement details"
          >
            {isMobile ? 'Close details' : null}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ marginBottom: documents.length ? '24px' : 0, lineHeight: 1.8 }}>
          <p
            style={{
              fontSize: isMobile ? '14px' : '15px',
              color: 'var(--color-ink)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
            }}
          >
            {getContent(item)}
          </p>
        </div>

        {documents.length > 0 ? (
          <div style={{ paddingTop: '22px', borderTop: '1px solid var(--color-edge-subtle)' }}>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: 'var(--color-ink)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 12px 0',
              }}
            >
              Attachments
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 600px))', gap: '12px' }}>
              {documents.map((doc, docIdx) => {
                const url = resolveMediaUrl(doc.fichier);
                const file = doc.fichier || '';
                const { isImage, isVideo } = getFileTypeFlags(file);

                return (
                  <div
                    key={doc.id || `${file}-${docIdx}`}
                    style={{
                      width: '100%',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      border: '1px solid var(--color-edge)',
                      background: 'var(--color-surface)',
                      boxShadow: '0 10px 28px rgba(0,0,0,0.16)',
                    }}
                  >
                    {isImage ? (
                      <img
                        src={url}
                        alt={doc?.nomDocument || 'Attachment'}
                        style={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: isMobile ? '320px' : '460px',
                          objectFit: 'contain',
                          display: 'block',
                          background: 'var(--color-canvas)',
                        }}
                      />
                    ) : null}

                    {isVideo ? (
                      <video
                        src={url}
                        controls
                        controlsList="nodownload"
                        style={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: isMobile ? '320px' : '430px',
                          objectFit: 'contain',
                          display: 'block',
                          background: 'black',
                        }}
                      />
                    ) : null}

                    {!isImage && !isVideo ? (
                      <div style={{ padding: isMobile ? '18px' : '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <IconFile className="h-6 w-6" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--color-brand)',
                            fontWeight: 700,
                            textDecoration: 'none',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {doc?.nomDocument || doc?.fichier?.split('/').pop() || 'Open attachment'}
                        </a>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function News() {
  const { user } = useAuth();
  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (String(user.coreRole || '').toLowerCase() === 'admin') return true;
    if (Array.isArray(user.roles)) {
      return user.roles.some((r) => {
        const name = typeof r === 'string' ? r : (r?.nom || r?.name || '');
        return String(name).toLowerCase() === 'admin';
      });
    }
    return String(user.role || '').toLowerCase() === 'admin';
  }, [user]);
  const isMobile = useIsMobile(640);

  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAnnonce, setEditingAnnonce] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [removedDocumentIds, setRemovedDocumentIds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [expandedAnnouncementId, setExpandedAnnouncementId] = useState(null);

  const [formData, setFormData] = useState({
    titre: '',
    contenu: '',
    typeAnnonce: 'Administrative',
    priority: 'normal',
    target: 'tous',
    cible: 'tous',
  });

  const VISIBILITY_OPTIONS = [
    { value: 'tous', label: 'Everyone (public)' },
    { value: 'etudiants', label: 'Students only' },
    { value: 'enseignants', label: 'Teachers only' },
    { value: 'administration', label: 'Administration only' },
  ];

  useEffect(() => {
    injectNewsStyles();
  }, []);

  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      const response = await request('/api/v1/annonces');
      setAnnonces(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      setAnnonces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnonces();
  }, []);

  const filterCategories = useMemo(() => {
    const categoryMap = new Map();

    categories.slice(1).forEach((category) => {
      const key = normalizeFilterKey(category.value || category.name);
      if (key) categoryMap.set(key, { name: category.name, value: key });
    });

    annonces.forEach((item) => {
      const label = getCategoryName(item);
      const key = normalizeFilterKey(label);

      if (key && !categoryMap.has(key)) {
        categoryMap.set(key, { name: label, value: key });
      }
    });

    return [{ name: 'All', value: '' }, ...Array.from(categoryMap.values())];
  }, [annonces]);

  const filteredAnnonces = useMemo(() => {
    if (!activeCategory) return annonces;
    return annonces.filter((item) => getCategoryFilterKey(item) === activeCategory);
  }, [annonces, activeCategory]);

  const urgentAnnonces = useMemo(() => annonces.filter(isImportantAnnouncement), [annonces]);

  const resetForm = () => {
    setEditingAnnonce(null);
    setSelectedFiles([]);
    setRemovedDocumentIds([]);
    setFormData({
      titre: '',
      contenu: '',
      typeAnnonce: 'Administrative',
      priority: 'normal',
      target: 'tous',
    cible: 'tous',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Read fresh values & validate ONCE, with clear field messages.
    const titre = (formData.titre || '').trim();
    const contenu = (formData.contenu || '').trim();
    const errors = [];
    if (!titre)   errors.push('Title is required.');
    if (!contenu) errors.push('Content is required.');
    if (errors.length) {
      window.alert(errors.join('\n'));
      return;
    }

    try {
      const payload = new FormData();
      // Each field appended exactly ONCE — multer/express only reads the last
      // value when keys repeat, which silently masked the fields before.
      payload.append('titre',       titre);
      payload.append('contenu',     contenu);
      payload.append('typeAnnonce', formData.typeAnnonce || 'Administrative');
      payload.append('priority',    formData.priority    || 'normal');
      // Backend reads `cible` (DB column) first, falls back to `visibility`.
      // Older form state may still have `target` — accept either, default to 'tous'.
      payload.append('cible',       formData.cible || formData.target || 'tous');

      selectedFiles.forEach((file) => {
        payload.append('files', file);
      });

      removedDocumentIds.forEach((id) => {
        payload.append('removedDocumentIds', String(id));
      });

      if (editingAnnonce) {
        await request(`/api/v1/annonces/${editingAnnonce.id}`, {
          method: 'PUT',
          body: payload,
        });
      } else {
        await request('/api/v1/annonces', {
          method: 'POST',
          body: payload,
        });
      }

      setShowModal(false);
      resetForm();
      await fetchAnnonces();
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;

    try {
      await request(`/api/v1/annonces/${Number(id)}`, { method: 'DELETE' });
      setOpenMenuId(null);
      await fetchAnnonces();
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'Delete failed.');
    }
  };

  const handleEdit = (item) => {
    setEditingAnnonce(item);
    setSelectedFiles([]);
    setRemovedDocumentIds([]);
    setFormData({
      titre: getTitle(item),
      contenu: getContent(item),
      typeAnnonce: getCategoryName(item),
      priority: normalizePriority(item) || 'normal',
      target: item?.cible || item?.target || 'tous',
      cible: item?.cible || item?.target || 'tous',
    });
    setShowModal(true);
  };

  const handleFileInput = (event) => {
    const newFiles = Array.from(event.target.files || []);

    setSelectedFiles((prevFiles) => {
      const mergedFiles = [...prevFiles];

      newFiles.forEach((newFile) => {
        const alreadyExists = mergedFiles.some(
          (file) => file.name === newFile.name && file.size === newFile.size && file.lastModified === newFile.lastModified
        );

        if (!alreadyExists) mergedFiles.push(newFile);
      });

      return mergedFiles;
    });

    event.target.value = '';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-canvas)',
        paddingBottom: isMobile ? '88px' : '0px',
      }}
    >
      {/* Compact page: the dashboard already has the visible News header. */}

      <main style={{ margin: 0, padding: 0 }}>
        <section
          style={{
            position: 'sticky',
            top: isMobile ? 'var(--news-mobile-sticky-top, 0px)' : 'var(--news-desktop-sticky-top, 0px)',
            zIndex: 40,
            margin: 0,
            background: 'color-mix(in srgb, var(--color-canvas) 98%, transparent)',
            borderTop: 'none',
            borderBottom: '1px solid var(--color-edge-subtle)',
            boxShadow: 'none',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          <div
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
              padding: isMobile ? '0 14px 6px' : '0 24px 10px',
            }}
          >
            <div
              className="news-hide-scrollbar"
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
                gap: isMobile ? '7px' : '8px',
                overflowX: 'auto',
                overflowY: 'hidden',
                padding: isMobile ? '4px 0' : '6px 0',
                margin: 0,
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                touchAction: 'pan-x',
                maxWidth: '100%',
                scrollSnapType: isMobile ? 'x proximity' : 'none',
              }}
            >
              {filterCategories.map((category) => {
                const count = category.value
                  ? annonces.filter((item) => getCategoryFilterKey(item) === category.value).length
                  : annonces.length;
                const isActive = activeCategory === category.value;

                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setActiveCategory(category.value)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: isMobile ? '6px' : '7px',
                      borderRadius: '999px',
                      border: `1px solid ${isActive ? 'var(--color-brand)' : 'var(--color-edge)'}`,
                      background: isActive ? 'var(--color-brand-light)' : 'var(--color-surface)',
                      padding: isMobile ? '6px 10px' : '7px 12px',
                      fontSize: isMobile ? '11.5px' : '12px',
                      fontWeight: 800,
                      color: isActive ? 'var(--color-brand)' : 'var(--color-ink-secondary)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flex: '0 0 auto',
                      maxWidth: isMobile ? '148px' : 'none',
                      minHeight: isMobile ? '32px' : '32px',
                      scrollSnapAlign: 'start',
                      boxShadow: isMobile && isActive ? '0 6px 14px rgba(0, 0, 0, 0.14)' : 'none',
                    }}
                  >
                    <span
                      style={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {category.name}
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: isMobile ? '19px' : '19px',
                        height: isMobile ? '19px' : '19px',
                        borderRadius: '999px',
                        background: isActive ? 'var(--color-brand)' : 'var(--color-edge)',
                        color: isActive ? 'white' : 'var(--color-ink-secondary)',
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '0 5px',
                        flexShrink: 0,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: isMobile ? '8px 14px 10px' : '12px 24px 14px',
          }}
        >
          {urgentAnnonces.length > 0 ? (
            <UrgentAnnouncementsCarousel items={urgentAnnonces} isMobile={isMobile} />
          ) : (
            <EmptyUrgentState
              isMobile={isMobile}
              isAdmin={isAdmin}
              onAdd={() => { resetForm(); setShowModal(true); }}
            />
          )}
        </section>

        <section
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: isMobile ? '8px 14px 16px' : '14px 24px 24px',
          }}
        >
          <div
            style={{
              borderRadius: isMobile ? '0' : '14px',
              border: isMobile ? 'none' : '1px solid var(--color-edge-subtle)',
              overflow: isMobile ? 'visible' : 'hidden',
              background: isMobile ? 'transparent' : 'var(--color-surface)',
              boxShadow: isMobile ? 'none' : '0 3px 12px rgba(0, 0, 0, 0.05)',
            }}
          >
            {loading ? (
              <div
                style={{
                  borderRadius: isMobile ? '16px' : 0,
                  background: 'var(--color-surface)',
                  padding: isMobile ? '44px 18px' : '64px 24px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink-secondary)', margin: 0 }}>Loading announcements...</p>
              </div>
            ) : filteredAnnonces.length === 0 ? (
              <div
                style={{
                  borderRadius: isMobile ? '16px' : 0,
                  background: 'var(--color-surface)',
                  padding: isMobile ? '44px 18px' : '64px 24px',
                  textAlign: 'center',
                }}
              >
                <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-tertiary)" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 4px' }}>No announcements found</p>
                <p style={{ fontSize: '14px', color: 'var(--color-ink-secondary)', margin: 0 }}>Check back later or try a different category.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '14px' : 0 }}>
                {filteredAnnonces.map((item) => {
                  const isExpanded = expandedAnnouncementId === item.id;

                  return (
                    <div key={item.id}>
                      <AnnouncementRow
                        item={item}
                        isAdmin={isAdmin}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        isExpanded={isExpanded}
                        onToggleExpand={() => setExpandedAnnouncementId(isExpanded ? null : item.id)}
                        isMobile={isMobile}
                      />

                      {isExpanded ? (
                        <ExpandedAnnouncement item={item} onClose={() => setExpandedAnnouncementId(null)} isMobile={isMobile} />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {showModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
              resetForm();
            }
          }}
        >
          <div className="news-bounce-in max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-edge bg-surface shadow-card sm:max-w-2xl sm:rounded-xl">
            <div className="sticky top-0 z-10 border-b border-edge-subtle bg-surface px-5 py-4 sm:px-8 sm:py-6">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-edge sm:hidden" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Administration</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
                {editingAnnonce ? 'Edit Announcement' : 'New Announcement'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-4 py-5 sm:px-8 sm:py-8">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-secondary">Title</label>
                <input
                  type="text"
                  placeholder="Title"
                  className={inputClassName}
                  value={formData.titre}
                  onChange={(event) => setFormData((prev) => ({ ...prev, titre: event.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-secondary">Content</label>
                <textarea
                  placeholder="Content"
                  className={`${inputClassName} min-h-[170px] resize-y`}
                  value={formData.contenu}
                  onChange={(event) => setFormData((prev) => ({ ...prev, contenu: event.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                  {editingAnnonce ? 'Manage Attachments' : 'Attach Files (optional)'}
                </label>

                {editingAnnonce?.documents?.length > 0 ? (
                  <div className="mb-3 space-y-2">
                    <p className="text-xs font-medium text-ink-tertiary">Current attachments</p>

                    {editingAnnonce.documents
                      .filter((doc) => !removedDocumentIds.includes(doc.id))
                      .map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-3 rounded-md border border-edge bg-surface-200 px-3 py-2">
                          <span className="truncate text-sm text-ink-secondary">
                            {doc.nomDocument || doc.fichier?.split('/').pop() || 'Attachment'}
                          </span>

                          <button
                            type="button"
                            onClick={() => setRemovedDocumentIds((prev) => [...prev, doc.id])}
                            className="rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                  </div>
                ) : null}

                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.mp4,.mpeg,.mov,.avi,.wmv,.webm,.ogv,.3gp,.flv"
                  onChange={handleFileInput}
                  className="block w-full rounded-md border border-control-border bg-control-bg px-3 py-2 text-sm text-ink-secondary file:mr-3 file:rounded-md file:border file:border-edge file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink-secondary hover:file:bg-surface-200 focus:outline-none focus:ring-2 focus:ring-brand/30"
                />

                {selectedFiles.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-ink-tertiary">New selected attachments</p>

                    {selectedFiles.map((file, index) => (
                      <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-md border border-edge bg-surface-200 px-3 py-2">
                        <span className="truncate text-sm text-ink-secondary">{file.name}</span>

                        <button
                          type="button"
                          onClick={() => setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                          className="rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <p className="mt-2 text-xs leading-5 text-ink-tertiary">
                  Supported: PDF, DOC, DOCX, images and videos. Maximum size: 500MB.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-secondary">Category</label>
                  <select
                    className={inputClassName}
                    value={formData.typeAnnonce}
                    onChange={(event) => setFormData((prev) => ({ ...prev, typeAnnonce: event.target.value }))}
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-secondary">Priority</label>
                  <select
                    className={inputClassName}
                    value={formData.priority}
                    onChange={(event) => setFormData((prev) => ({ ...prev, priority: event.target.value }))}
                  >
                    {ANNOUNCEMENT_PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-secondary">Audience</label>
                <select
                  className={inputClassName}
                  value={formData.target}
                  onChange={(event) => setFormData((prev) => ({ ...prev, target: event.target.value }))}
                >
                  <option value="tous">Everyone</option>
                  <option value="etudiants">Students</option>
                  <option value="enseignants">Teachers</option>
                  <option value="administration">Administration</option>
                </select>
                <p className="mt-1 text-xs text-ink-tertiary">Select the audience for this announcement.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                  Visibility <span className="text-danger">*</span>
                </label>
                <select
                  className={inputClassName}
                  value={formData.cible || 'tous'}
                  onChange={(event) => setFormData((prev) => ({ ...prev, cible: event.target.value }))}
                >
                  {VISIBILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-ink-tertiary">
                  Restrict who sees this announcement. "Everyone" is the default and is visible on the public landing.
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-edge-subtle pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-md border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink-secondary transition-all duration-150 hover:bg-surface-200 hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-canvas"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex min-h-[42px] items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-hover active:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-canvas"
                >
                  {editingAnnonce ? 'Update' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
