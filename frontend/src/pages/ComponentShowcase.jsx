import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';

// Design System Components
import { Topbar, Sidebar } from '../design-system/components/navigation';
import { Button } from '../design-system/components/Button';
import { Card, CardHeader, CardBody, CardTitle, CardDescription, CardFooter } from '../design-system/components/Card';
import { TextInput, PasswordInput, Checkbox } from '../design-system/components/form';
import { Modal } from '../design-system/components/Modal';
import { Alert } from '../design-system/components/Alert';

/**
 * COMPONENT SHOWCASE PAGE
 * Comprehensive demonstration of all Design System components.
 * Structured exactly for the PFE Report screenshots.
 */

// Custom bounce animation (simulating the global style)
const bounceStyle = `
  @keyframes bounceIn {
    0% { opacity: 0; transform: scale(0.95) translateY(10px); }
    50% { opacity: 1; transform: scale(1.02); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  .bounce-in { animation: bounceIn 0.5s ease-out; }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.setAttribute('data-component', 'bounce-animation');
  styleSheet.textContent = bounceStyle;
  if (!document.querySelector('style[data-component="bounce-animation"]')) {
    document.head.appendChild(styleSheet);
  }
}

// ============================================================================
// 1. BUTTONS SHOWCASE
// ============================================================================
function ButtonShowcase() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLoad = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-ink-secondary mb-3">Variants</h4>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-ink-secondary mb-3">Sizes</h4>
        <div className="flex flex-wrap items-end gap-4">
          <Button size="sm">Small (32px)</Button>
          <Button size="md">Medium (36px)</Button>
          <Button size="lg">Large (40px)</Button>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-ink-secondary mb-3">States</h4>
        <div className="flex flex-wrap gap-4">
          <Button disabled>Disabled</Button>
          <Button loading={isLoading} onClick={handleLoad}>
            {isLoading ? 'Loading...' : 'Click to Load'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. FORMS SHOWCASE
// ============================================================================
function FormShowcase() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="max-w-md space-y-5">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Standard Text Input</label>
        <TextInput placeholder="Enter your email" />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1">With Error</label>
        <TextInput placeholder="Enter username" error="This field is required" />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Password Input</label>
        <PasswordInput placeholder="Enter your password" />
      </div>
      <div className="pt-2">
        <Checkbox 
          id="terms" 
          checked={checked} 
          onChange={(e) => setChecked(e.target.checked)}
          label="I agree to the terms and conditions"
        />
      </div>
    </div>
  );
}

// ============================================================================
// 3. FEEDBACK (ALERTS & MODALS) SHOWCASE
// ============================================================================
function FeedbackShowcase() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-ink-secondary mb-3">Alerts (Inline Feedback)</h4>
        <div className="space-y-3">
          <Alert variant="info" title="Information">This is an informational message.</Alert>
          <Alert variant="success" title="Success">Your changes have been saved successfully.</Alert>
          <Alert variant="warning" title="Warning">Your session is about to expire.</Alert>
          <Alert variant="error" title="Error">Failed to process your request. Please try again.</Alert>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-ink-secondary mb-3">Modals (Focus Feedback)</h4>
        <Button onClick={() => setShowModal(true)}>Open Animated Modal</Button>
      </div>

      {/* The Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-bold text-ink mb-2">Confirm Action</h2>
          <p className="text-ink-secondary mb-6">
            Are you sure you want to perform this action? This represents our standard modal component using the glass-effect overlay.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setShowModal(false)}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// 4. CARDS SHOWCASE
// ============================================================================
function CardShowcase() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Standard Card</CardTitle>
          <CardDescription>This is how we display grouped information.</CardDescription>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-ink-secondary">
            The Card component uses the `--shadow-card` token, which automatically adapts when switching to Dark Mode to remain visible without being overwhelming.
          </p>
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button variant="secondary" size="sm">Action</Button>
        </CardFooter>
      </Card>

      <Card className="hover-lift border-brand">
        <CardHeader>
          <CardTitle className="text-brand">Interactive Card</CardTitle>
          <CardDescription>With hover-lift utility</CardDescription>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-ink-secondary">
            This card uses the `.hover-lift` utility class to provide physical feedback when users interact with it.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}


// ============================================================================
// MAIN PAGE LAYOUT
// ============================================================================
export default function ComponentShowcase() {
  const [expandedSection, setExpandedSection] = useState('buttons');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sections = [
    {
      id: 'buttons',
      title: 'Buttons (Atomic)',
      description: 'The primary control element. Displays variants, sizes, and states.',
      component: <ButtonShowcase />,
    },
    {
      id: 'forms',
      title: 'Form Inputs (Molecules)',
      description: 'Text inputs, passwords with toggles, and checkboxes.',
      component: <FormShowcase />,
    },
    {
      id: 'feedback',
      title: 'Feedback (Alerts & Modals)',
      description: 'Inline alerts and overlay modals for system communication.',
      component: <FeedbackShowcase />,
    },
    {
      id: 'cards',
      title: 'Cards (Organisms)',
      description: 'Containers for grouped information with header, body, and footer.',
      component: <CardShowcase />,
    }
  ];

  const sidebarModules = [
    { path: '/showcase', name: 'UI Components', badgeCount: 0 },
    { path: '/dashboard', name: 'Back to Dashboard', badgeCount: 0 },
  ];

  return (
    <div className="flex h-screen bg-canvas font-sans">
      <Sidebar
        modules={sidebarModules}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeKey="/showcase"
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          role="admin"
          user={{ prenom: 'Design', nom: 'System', email: 'ui@univ-ibn-khaldoun.dz' }}
          onLogout={() => {}}
          onHamburger={() => setSidebarOpen(!sidebarOpen)}
          activeKey="/showcase"
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="rounded-xl border border-edge bg-surface shadow-soft p-6 md:p-8">
              <h1 className="text-3xl font-bold text-ink mb-2">Design System Showcase</h1>
              <p className="text-ink-secondary max-w-3xl">
                This environment presents all fundamental components of the Core Template. 
                Use the Topbar to switch between Light/Dark modes and Accent Colors to see the semantic tokens in action.
              </p>
            </div>

            {/* Components Accordion */}
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="rounded-xl border border-edge bg-surface shadow-soft overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-100 transition-colors"
                  >
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-ink">{section.title}</h2>
                      <p className="text-sm text-ink-secondary mt-1">{section.description}</p>
                    </div>
                    <svg
                      className={`h-6 w-6 text-ink-tertiary transition-transform duration-300 ${expandedSection === section.id ? 'rotate-180 text-brand' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedSection === section.id && (
                    <div className="px-6 py-8 border-t border-edge bg-surface-50">
                      {section.component}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
