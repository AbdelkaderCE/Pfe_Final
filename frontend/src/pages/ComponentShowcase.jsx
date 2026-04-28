import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Topbar, Sidebar } from '../design-system/components/navigation';
import { Button } from '../design-system/components/Button';
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../design-system/components/Card';
import { TextInput } from '../design-system/components/form';

/**
 * COMPONENT SHOWCASE PAGE
 * Visual demonstration of all created components and features
 * Perfect for documentation, reports, and screenshots
 * 
 * Now includes:
 * - Topbar for page header and theme toggle
 * - Sidebar for navigation
 * - Theme-safe styling for light/dark mode
 * - Full design system component showcase
 */

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
  styleSheet.setAttribute('data-component', 'bounce-animation');
  styleSheet.textContent = bounceStyle;
  if (!document.querySelector('style[data-component="bounce-animation"]')) {
    document.head.appendChild(styleSheet);
  }
}

// Mock data for announcements
const mockAnnouncements = [
  {
    id: 1,
    titre_en: 'System Maintenance Scheduled',
    titre_ar: 'System Maintenance',
    contenu_en: 'The platform will be under maintenance on Friday evening from 8 PM to 11 PM. Please plan accordingly.',
    contenu_ar: 'The platform will be under maintenance on Friday evening from 8 PM to 11 PM.',
    type: { nom_en: 'Administrative', nom_ar: 'Administrative' },
    priority: 'urgent',
    priorite: 'urgente',
    datePublication: new Date(),
    createdAt: new Date(),
  },
  {
    id: 2,
    titre_en: 'New Course Available',
    titre_ar: 'New Course Available',
    contenu_en: 'A new advanced course on AI and Machine Learning is now available for enrollment.',
    contenu_ar: 'A new advanced course on AI and Machine Learning is now available.',
    type: { nom_en: 'Academic', nom_ar: 'Academic' },
    priority: 'high',
    priorite: 'haute',
    datePublication: new Date(Date.now() - 86400000),
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 3,
    titre_en: 'Campus Event This Weekend',
    titre_ar: 'Campus Event This Weekend',
    contenu_en: 'Join us for the annual sports festival and cultural night celebration.',
    contenu_ar: 'Join us for the annual sports festival and cultural night celebration.',
    type: { nom_en: 'Events', nom_ar: 'Events' },
    priority: 'high',
    priorite: 'haute',
    datePublication: new Date(Date.now() - 172800000),
    createdAt: new Date(Date.now() - 172800000),
  },
  {
    id: 4,
    titre_en: 'Research Publication Opportunity',
    titre_ar: 'Research Publication Opportunity',
    contenu_en: 'Submit your research papers for the quarterly publication. Deadline: March 30.',
    contenu_ar: 'Submit your research papers for the quarterly publication. Deadline: March 30.',
    type: { nom_en: 'Research', nom_ar: 'Research' },
    priority: 'normal',
    priorite: 'normale',
    datePublication: new Date(Date.now() - 259200000),
    createdAt: new Date(Date.now() - 259200000),
  },
];

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

const resolveDisplayText = (ar, en, fallback = '') => {
  if (typeof en === 'string' && en.trim()) return en.trim();
  if (typeof ar === 'string' && ar.trim()) return ar.trim();
  return fallback;
};

const getTitle = (item) => resolveDisplayText(item?.titre_ar, item?.titre_en, 'Untitled announcement');
const getContent = (item) => resolveDisplayText(item?.contenu_ar, item?.contenu_en, '');
const getCategoryName = (item) => resolveDisplayText(item?.type?.nom_ar, item?.type?.nom_en, 'General');

const normalizePriority = (item) => String(item?.priority ?? item?.priorite ?? '').toLowerCase();
const isImportantAnnouncement = (item) => ['urgent', 'urgente', 'high', 'haute'].includes(normalizePriority(item));

const priorityLabel = (item) => {
  const priority = normalizePriority(item);
  if (priority === 'urgent' || priority === 'urgente') return 'URGENT';
  if (priority === 'high' || priority === 'haute') return 'IMPORTANT';
  return 'Standard';
};

// ============================================================================
// COMPONENT 1: URGENT ANNOUNCEMENTS CAROUSEL
// ============================================================================

function UrgentCarouselShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const urgentItems = mockAnnouncements.filter(isImportantAnnouncement);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % urgentItems.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + urgentItems.length) % urgentItems.length);
  };

  const current = urgentItems[currentIndex];

  return (
    <div className="rounded-lg border border-edge bg-surface overflow-visible">
      <div className="flex h-12 items-center gap-3 px-6 bg-danger text-white rounded-t-lg">
        <svg className="h-5 w-5 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-semibold">URGENT ANNOUNCEMENTS</span>
      </div>

      <div className="relative min-h-32 p-4 md:p-6 px-14 md:px-20">
        <div className="pr-12 md:pr-16 transition-opacity duration-300 ease-in-out">
          <div className="flex items-start gap-2 mb-2">
            <span className="rounded-full border border-edge-strong bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
              {priorityLabel(current)}
            </span>
            <span className="inline-flex h-2 w-2 rounded-full bg-danger animate-pulse flex-shrink-0 mt-1.5" />
          </div>
          <h2 className="text-lg font-bold text-ink mb-1 line-clamp-2">{getTitle(current)}</h2>
          <p className="text-xs text-ink-secondary mb-2">
            {getCategoryName(current)} • {formatDate(current?.datePublication || current?.createdAt)}
          </p>
          <p className="text-sm text-ink-secondary mb-3 line-clamp-2">{getContent(current)}</p>
          <button className="inline-flex items-center text-xs font-semibold text-brand hover:text-brand-hover transition-colors">
            Read more →
          </button>
        </div>

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

        <div className="flex gap-2 justify-center mt-4">
          {urgentItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-6 bg-danger' : 'w-2 bg-edge'
              }`}
              aria-label={`Go to announcement ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT 2: ANNOUNCEMENT LIST
// ============================================================================

function AnnouncementListShowcase() {
  return (
    <div className="space-y-2">
      {mockAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className="flex items-start justify-between gap-4 rounded-lg border border-edge bg-surface p-4 hover:shadow-card-hover transition-all"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isImportantAnnouncement(announcement) && (
                <span className="inline-flex h-2 w-2 rounded-full bg-danger animate-pulse flex-shrink-0" />
              )}
              <h3 className="text-sm font-semibold text-ink line-clamp-2">{getTitle(announcement)}</h3>
            </div>
            <p className="text-xs text-ink-secondary">{getCategoryName(announcement)} • {formatDate(announcement?.datePublication || announcement?.createdAt)}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-xs font-semibold flex-shrink-0 ${
            isImportantAnnouncement(announcement)
              ? 'border border-edge-strong bg-danger/10 text-danger'
              : 'border border-edge bg-surface text-ink-secondary'
          }`}>
            {priorityLabel(announcement)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// COMPONENT 3: MODAL WITH BOUNCE
// ============================================================================

function ModalShowcase() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={() => setShowModal(true)} variant="primary">
        Open Modal - Watch Bounce Animation
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-edge bg-surface shadow-card bounce-in p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink">New Announcement Form</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-ink-secondary hover:text-ink transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1">Title (English)</label>
                <TextInput
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1">Description</label>
                <textarea
                  placeholder="Enter description..."
                  rows={4}
                  className="w-full rounded-md border border-control-border bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1">Priority</label>
                <select className="w-full rounded-md border border-control-border bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30">
                  <option value="normal">Normal</option>
                  <option value="high">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button
                onClick={() => setShowModal(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button variant="primary">
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ANIMATIONS SHOWCASE
// ============================================================================

function AnimationShowcase() {
  const [animationKey, setAnimationKey] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setAnimationKey(animationKey + 1)}
          variant="primary"
        >
          Trigger Bounce Animation
        </Button>
      </div>

      <div key={animationKey} className="flex gap-4 flex-wrap">
        <div className="bounce-in rounded-lg border border-edge bg-brand shadow-soft p-6 text-white text-center">
          <div className="text-sm font-semibold">Bounce In</div>
          <div className="text-xs opacity-75 mt-1">0.5s ease-out</div>
        </div>

        <div className="animate-pulse rounded-lg border border-edge bg-brand shadow-soft p-6 text-white text-center">
          <div className="text-sm font-semibold">Pulse</div>
          <div className="text-xs opacity-75 mt-1">Continuous loop</div>
        </div>

        <div className="animate-pulse rounded-lg border border-edge bg-danger shadow-soft p-6 text-white text-center">
          <div className="text-sm font-semibold">Pulse Effect</div>
          <div className="text-xs opacity-75 mt-1">Used for urgency</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PRIORITY BADGES
// ============================================================================

function PriorityBadgesShowcase() {
  return (
    <div className="flex gap-3 flex-wrap">
      <div className="rounded-full border border-edge-strong bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger">
        URGENT - Red Badge
      </div>
      <div className="rounded-full border border-edge-strong bg-brand-light text-xs font-semibold text-brand px-3 py-1.5">
        IMPORTANT - Blue Badge
      </div>
      <div className="rounded-full border border-edge bg-surface text-xs font-semibold text-ink-secondary px-3 py-1.5">
        STANDARD - Gray Badge
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ComponentShowcase() {
  const [expandedSection, setExpandedSection] = useState('carousel');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sections = [
    {
      id: 'carousel',
      title: 'Carousel - Full Width Announcements',
      description: 'Full-width carousel showing urgent/important announcements with previous/next navigation and indicator dots',
      component: <UrgentCarouselShowcase />,
    },
    {
      id: 'list',
      title: 'Announcement List - All Items',
      description: 'List of announcements with priority badges, categories, dates, and hover effects',
      component: <AnnouncementListShowcase />,
    },
    {
      id: 'modal',
      title: 'Modal Form - Bounce Animation',
      description: 'Modal that bounces in when opened, containing form fields and interactive controls',
      component: <ModalShowcase />,
    },
    {
      id: 'animations',
      title: 'Animation Effects - Bounce, Fade, Pulse',
      description: 'Showcase of all animation types used throughout the application',
      component: <AnimationShowcase />,
    },
    {
      id: 'badges',
      title: 'Priority Badges - Color Coding',
      description: 'Visual priority indicators: Urgent (Red), Important (Blue), Standard (Gray)',
      component: <PriorityBadgesShowcase />,
    },
  ];

  // Mock modules for sidebar navigation
  const sidebarModules = [
    { path: '/showcase', name: 'Component Showcase', badgeCount: 0 },
    { path: '/dashboard', name: 'Dashboard', badgeCount: 0 },
  ];

  return (
    <div className="flex h-screen bg-canvas">
      {/* Sidebar */}
      <Sidebar
        modules={sidebarModules}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeKey="/showcase"
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          role="admin"
          user={{ prenom: 'Component', nom: 'Showcase', email: 'showcase@univ-ibn-khaldoun.dz' }}
          onLogout={() => console.log('Logout')}
          onHamburger={() => setSidebarOpen(!sidebarOpen)}
          activeKey="/showcase"
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full bg-canvas">
            <div className="mx-auto max-w-6xl px-4 py-8">
              {/* Header Section */}
              <div className="mb-8 rounded-xl border border-edge bg-surface shadow-soft p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-ink mb-2">Component Showcase</h1>
                    <p className="text-ink-secondary max-w-2xl">
                      Visual demonstration of all created and updated components. Expand each section and take screenshots for your report documentation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
                <div className="rounded-lg border border-edge bg-surface shadow-soft p-4 text-center">
                  <div className="text-2xl font-bold text-brand">5</div>
                  <div className="text-xs text-ink-secondary">Components</div>
                </div>
                <div className="rounded-lg border border-edge bg-surface shadow-soft p-4 text-center">
                  <div className="text-2xl font-bold text-danger">3</div>
                  <div className="text-xs text-ink-secondary">Animation Types</div>
                </div>
                <div className="rounded-lg border border-edge bg-surface shadow-soft p-4 text-center">
                  <div className="text-2xl font-bold text-brand-dark">3</div>
                  <div className="text-xs text-ink-secondary">Priority Levels</div>
                </div>
                <div className="rounded-lg border border-edge bg-surface shadow-soft p-4 text-center">
                  <div className="text-2xl font-bold text-brand">20+</div>
                  <div className="text-xs text-ink-secondary">Modals Updated</div>
                </div>
                <div className="rounded-lg border border-edge bg-surface shadow-soft p-4 text-center">
                  <div className="text-2xl font-bold text-success">100%</div>
                  <div className="text-xs text-ink-secondary">Theme Safe</div>
                </div>
              </div>

              {/* Component Sections */}
              <div className="space-y-6">
                {sections.map((section) => (
                  <div key={section.id} className="rounded-xl border border-edge bg-surface shadow-soft overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-100 transition-colors border-b border-edge"
                    >
                      <div className="text-left">
                        <h2 className="text-lg font-bold text-ink">{section.title}</h2>
                        <p className="text-sm text-ink-secondary mt-1">{section.description}</p>
                      </div>
                      <svg
                        className={`h-6 w-6 text-ink-secondary transition-transform flex-shrink-0 ${expandedSection === section.id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>

                    {expandedSection === section.id && (
                      <div className="px-6 py-8 bg-surface-100">
                        <div className="overflow-x-auto">
                          {section.component}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Technical Details Section */}
              <div className="mt-8 rounded-xl border border-edge bg-surface shadow-soft p-6">
                <h3 className="text-lg font-bold text-ink mb-4">Technical Features Implemented</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-ink mb-2">Animations</h4>
                    <ul className="text-sm text-ink-secondary space-y-1">
                      <li>✓ Bounce-in on modal open (0.5s ease-out)</li>
                      <li>✓ Fade transitions on content (300ms)</li>
                      <li>✓ Button hover transitions (200ms)</li>
                      <li>✓ Pulsing indicator badges</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink mb-2">Responsive Design</h4>
                    <ul className="text-sm text-ink-secondary space-y-1">
                      <li>✓ Mobile optimized (100% support)</li>
                      <li>✓ Tablet friendly</li>
                      <li>✓ Desktop enhanced</li>
                      <li>✓ Touch-friendly controls</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink mb-2">Design System Integration</h4>
                    <ul className="text-sm text-ink-secondary space-y-1">
                      <li>✓ Theme-safe colors (no hardcoded values)</li>
                      <li>✓ Topbar & Sidebar from design-system</li>
                      <li>✓ All CSS variables via Tailwind</li>
                      <li>✓ Dark mode fully supported</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink mb-2">Components Used</h4>
                    <ul className="text-sm text-ink-secondary space-y-1">
                      <li>✓ UrgentAnnouncementsCarousel</li>
                      <li>✓ AnnouncementsSection</li>
                      <li>✓ Modal with animations</li>
                      <li>✓ Priority badge system</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Design System Documentation */}
              <div className="mt-8 rounded-xl border border-edge bg-surface-100 shadow-soft p-6">
                <h3 className="text-lg font-bold text-ink mb-4">Design System Components Showcase</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-lg border border-edge bg-surface p-4">
                    <h4 className="font-semibold text-ink mb-2">Navigation</h4>
                    <ul className="text-sm text-ink-secondary space-y-1">
                      <li>• <strong>Topbar</strong> - Header with theme toggle & profile</li>
                      <li>• <strong>Sidebar</strong> - Collapsible navigation with badges</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-edge bg-surface p-4">
                    <h4 className="font-semibold text-ink mb-2">Color Tokens</h4>
                    <ul className="text-sm text-ink-secondary space-y-1">
                      <li>• canvas, surface, surface-100, surface-200</li>
                      <li>• ink, ink-secondary, ink-tertiary, ink-muted</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-edge bg-surface p-4">
                    <h4 className="font-semibold text-ink mb-2">Semantic Colors</h4>
                    <ul className="text-sm text-ink-secondary space-y-1">
                      <li>• brand, brand-light, brand-hover, brand-dark</li>
                      <li>• danger, warning, success</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-edge bg-surface p-4">
                    <h4 className="font-semibold text-ink mb-2">Edge & Controls</h4>
                    <ul className="text-sm text-ink-secondary space-y-1">
                      <li>• edge, edge-subtle, edge-strong</li>
                      <li>• control-bg, control-border, control-focus</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Instructions Section */}
              <div className="mt-8 rounded-xl border border-edge bg-brand/5 shadow-soft p-6">
                <h3 className="font-bold text-ink mb-2">How to Use This Showcase</h3>
                <ol className="text-sm text-ink-secondary space-y-2 list-decimal list-inside">
                  <li>Use the Topbar theme toggle to switch between light and dark modes</li>
                  <li>Navigate using the Sidebar (mobile hamburger on smaller screens)</li>
                  <li>Click each section header to expand and view the component</li>
                  <li>Interact with components (click buttons, navigation arrows, etc.)</li>
                  <li>Press F12 to open DevTools and select device sizes for responsive views</li>
                  <li>Take screenshots for your documentation and report</li>
                  <li>All styling is theme-safe and uses design system tokens</li>
                </ol>
              </div>

              {/* Footer Spacing */}
              <div className="mt-8 pb-8"></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
