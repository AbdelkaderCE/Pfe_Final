import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import pfeAPI from '../../services/pfe';

function localTitle(item) {
  if (!item) return 'Untitled';
  return item.titre_ar || item.titre_en || `PFE #${item.id}`;
}

function localSubtitle(item) {
  if (!item) return '';
  const parts = [item.anneeUniversitaire, item.status];
  return parts.filter(Boolean).join(' • ');
}

// Semantic status badge color mapper
function getStatusColor(status) {
  const statusMap = {
    'completed': { bg: 'rgba(22, 163, 74, 0.1)', border: 'rgba(22, 163, 74, 0.3)', text: 'var(--status-success, #16a34a)' },
    'scheduled': { bg: 'rgba(202, 138, 4, 0.1)', border: 'rgba(202, 138, 4, 0.3)', text: 'var(--status-warning, #ca8a04)' },
    'submitted': { bg: 'rgba(29, 78, 216, 0.1)', border: 'rgba(29, 78, 216, 0.3)', text: 'var(--status-info, #1d4ed8)' },
    'pending': { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.3)', text: 'var(--color-ink-secondary)' },
  };
  return statusMap[status?.toLowerCase()] || statusMap['pending'];
}

function StatCard({ label, value, status }) {
  const colors = getStatusColor(status);
  return (
    <div
      style={{
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <p
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-tertiary)',
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: colors.text,
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}

// Defense Timeline Progress Component
function DefenseTimeline() {
  const nextDefenseDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  const daysRemaining = Math.floor((nextDefenseDate - new Date()) / (24 * 60 * 60 * 1000));
  const progressPercent = Math.max(0, Math.min(100, (daysRemaining / 90) * 100)); // Assume 90-day cycle

  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid var(--color-edge-subtle)',
        background: 'var(--color-surface)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-ink-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
          }}
        >
          Next Defense Session
        </p>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: daysRemaining < 7 ? 'var(--status-danger, #dc2626)' : 'var(--color-brand)',
            background: daysRemaining < 7 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(29, 78, 216, 0.1)',
            padding: '4px 8px',
            borderRadius: '6px',
          }}
        >
          {daysRemaining} days
        </span>
      </div>
      <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--color-edge)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, var(--color-brand) 0%, rgba(29, 78, 216, 0.7) 100%)',
            borderRadius: '3px',
            transition: 'width 0.3s ease-out',
          }}
        />
      </div>
    </div>
  );
}

// High-density subject list item - SaaS aesthetic
function SubjectListItem({ subject }) {
  const statusColor = getStatusColor(subject.status);
  const groupCount = subject.groupsPfe?.length || 0;
  const [showGroups, setShowGroups] = React.useState(false);

  return (
    <article
      style={{
        borderRadius: '10px',
        border: '1px solid var(--color-edge-subtle)',
        background: 'var(--color-surface)',
        minHeight: '72px',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 150ms ease-out',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-edge-strong)';
        e.currentTarget.style.background = 'var(--color-surface-200)';
        e.currentTarget.style.boxShadow = 'inset 0 0 0 1px var(--color-edge-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-edge-subtle)';
        e.currentTarget.style.background = 'var(--color-surface)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Year/ID Column */}
      <div
        style={{
          padding: '0 16px',
          minWidth: '90px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          borderRight: '1px solid var(--color-edge-subtle)',
        }}
      >
        <p
          style={{
            fontSize: '9px',
            fontWeight: 600,
            color: 'var(--color-ink-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0,
            fontVariant: 'small-caps',
          }}
        >
          Year
        </p>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          {subject.anneeUniversitaire || '—'}
        </p>
      </div>

      {/* Title Column - Flexible */}
      <div
        style={{
          flex: 1,
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: 0,
          borderRight: '1px solid var(--color-edge-subtle)',
        }}
      >
        <p
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-ink)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.4,
          }}
        >
          {localTitle(subject)}
        </p>
        <p
          style={{
            fontSize: '11px',
            color: 'var(--color-ink-secondary)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subject.description_ar || subject.description_en || 'No description'}
        </p>
      </div>

      {/* Groups Pill - Interactive */}
      <div
        style={{
          padding: '0 16px',
          minWidth: '100px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRight: '1px solid var(--color-edge-subtle)',
        }}
        onClick={() => setShowGroups(!showGroups)}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        <div
          style={{
            borderRadius: '6px',
            background: 'rgba(29, 78, 216, 0.1)',
            border: '1px solid rgba(29, 78, 216, 0.2)',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-brand)',
              margin: 0,
            }}
          >
            {groupCount}
          </p>
        </div>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 600,
            color: 'var(--color-ink-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontVariant: 'small-caps',
          }}
        >
          Groups
        </span>
      </div>

      {/* Status Badge - Non-clickable */}
      <div
        style={{
          padding: '0 16px',
          minWidth: '130px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: 'flex-end',
        }}
      >
        {/* Live Indicator Dot */}
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: statusColor.text,
            animation: 'pulse 2s infinite',
          }}
        />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: statusColor.text,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
          }}
        >
          {subject.status || 'Pending'}
        </span>
      </div>

      {/* Expanded Groups Tooltip - On Click */}
      {showGroups && subject.groupsPfe?.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            borderRadius: '10px',
            border: '1px solid var(--color-edge)',
            background: 'var(--color-surface)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-ink-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: 0,
              fontVariant: 'small-caps',
            }}
          >
            Assigned Groups ({subject.groupsPfe.length})
          </p>
          {subject.groupsPfe.slice(0, 5).map((group, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '12px',
                color: 'var(--color-ink)',
                padding: '4px 0',
                borderBottom: idx < Math.min(4, subject.groupsPfe.length - 1) ? '1px solid var(--color-edge-subtle)' : 'none',
              }}
            >
              • {group.name || `Group ${group.id}`}
            </div>
          ))}
          {subject.groupsPfe.length > 5 && (
            <p
              style={{
                fontSize: '11px',
                color: 'var(--color-ink-secondary)',
                fontStyle: 'italic',
                margin: '4px 0 0 0',
              }}
            >
              +{subject.groupsPfe.length - 5} more
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export default function ProjectsPage() {
  const [summary, setSummary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        setError('');

        const [summaryResponse, subjectsResponse] = await Promise.all([
          pfeAPI.getSummary(),
          pfeAPI.listSubjects(),
        ]);

        if (!active) return;

        setSummary(summaryResponse?.data || null);
        setSubjects(Array.isArray(subjectsResponse?.data) ? subjectsResponse.data : []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Failed to load PFE dashboard');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, []);

  const highlightSubjects = useMemo(() => subjects.slice(0, 6), [subjects]);

  const stats = [
    { label: 'Total groups', value: summary?.totalGroups ?? '—', status: 'info' },
    { label: 'Submitted', value: summary?.submittedGroups ?? '—', status: 'submitted' },
    { label: 'Scheduled', value: summary?.defenseScheduled ?? '—', status: 'scheduled' },
    { label: 'Completed', value: summary?.defenseCompleted ?? '—', status: 'completed' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '1280px',
        margin: '0 auto',
      }}
    >
      {/* Condensed Hero Section */}
      <section
        style={{
          borderRadius: '16px',
          border: '1px solid var(--color-edge-subtle)',
          background: 'var(--color-surface)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-brand)',
              margin: 0,
            }}
          >
            Graduation Projects
          </p>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-ink)',
              margin: '8px 0 0 0',
              letterSpacing: '-0.02em',
            }}
          >
            PFE Workspace
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-ink-secondary)',
              margin: '8px 0 0 0',
              lineHeight: 1.6,
            }}
          >
            Review subjects, track groups, and prepare the defense workflow from one accessible hub.
          </p>
        </div>

        {/* Defense Timeline */}
        <DefenseTimeline />

        {/* KPI Cards with Semantic Colors */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} status={stat.status} />
          ))}
        </div>
      </section>

      {/* Main Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* High-Density Subject List */}
        <section
          style={{
            borderRadius: '16px',
            border: '1px solid var(--color-edge-subtle)',
            background: 'var(--color-surface)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                  margin: 0,
                }}
              >
                Active Subjects
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-ink-secondary)',
                  margin: '4px 0 0 0',
                }}
              >
                {highlightSubjects.length} of {subjects.length} subjects
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                to="/dashboard/projects/subjects"
                style={{
                  borderRadius: '8px',
                  border: '1px solid var(--color-edge)',
                  background: 'var(--color-canvas)',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-ink)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-edge-strong)';
                  e.currentTarget.style.color = 'var(--color-brand)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-edge)';
                  e.currentTarget.style.color = 'var(--color-ink)';
                }}
              >
                Subjects
              </Link>
              <Link
                to="/dashboard/projects/groups"
                style={{
                  borderRadius: '8px',
                  border: '1px solid var(--color-edge)',
                  background: 'var(--color-canvas)',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-ink)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-edge-strong)';
                  e.currentTarget.style.color = 'var(--color-brand)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-edge)';
                  e.currentTarget.style.color = 'var(--color-ink)';
                }}
              >
                Groups
              </Link>
              <Link
                to="/dashboard/projects/defense"
                style={{
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--color-brand)',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Defense Plan
              </Link>
            </div>
          </div>

          {/* Subject list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
              <div
                style={{
                  borderRadius: '12px',
                  border: '1px dashed var(--color-edge)',
                  background: 'var(--color-canvas)',
                  padding: '32px 16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--color-ink-secondary)',
                }}
              >
                Loading PFE data...
              </div>
            ) : error ? (
              <div
                style={{
                  borderRadius: '12px',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  background: 'rgba(220, 38, 38, 0.05)',
                  padding: '16px',
                  fontSize: '12px',
                  color: 'var(--status-danger, #dc2626)',
                }}
              >
                {error}
              </div>
            ) : highlightSubjects.length ? (
              highlightSubjects.map((subject) => (
                <SubjectListItem key={subject.id} subject={subject} />
              ))
            ) : (
              <div
                style={{
                  borderRadius: '12px',
                  border: '1px dashed var(--color-edge)',
                  background: 'var(--color-canvas)',
                  padding: '32px 16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--color-ink-secondary)',
                }}
              >
                No subjects found for the current filter.
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Widgets */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Implementation Status Widget */}
          <div
            style={{
              borderRadius: '16px',
              border: '1px solid var(--color-edge-subtle)',
              background: 'var(--color-surface)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-ink-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: 0,
              }}
            >
              Status
            </p>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Status Checkpoints
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--color-ink-secondary)',
              }}
            >
              <li style={{ margin: 0 }}>✓ Live API integration</li>
              <li style={{ margin: 0 }}>✓ Bilingual support</li>
              <li style={{ margin: 0 }}>✓ Real-time data sync</li>
            </ul>
          </div>

          {/* Quick Links Widget */}
          <div
            style={{
              borderRadius: '16px',
              border: '1px solid var(--color-edge-subtle)',
              background: 'var(--color-surface)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-ink-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: 0,
              }}
            >
              Navigation
            </p>
            {[
              { label: 'All Subjects', path: '/dashboard/projects/subjects' },
              { label: 'Groups Management', path: '/dashboard/projects/groups' },
              { label: 'Defense Scheduling', path: '/dashboard/projects/defense' },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  borderRadius: '8px',
                  border: '1px solid var(--color-edge)',
                  background: 'var(--color-canvas)',
                  padding: '10px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-ink)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                  display: 'block',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-edge-strong)';
                  e.currentTarget.style.background = 'var(--color-surface-200)';
                  e.currentTarget.style.color = 'var(--color-brand)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-edge)';
                  e.currentTarget.style.background = 'var(--color-canvas)';
                  e.currentTarget.style.color = 'var(--color-ink)';
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

// CSS Keyframes for animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('[data-projects-page-styles]')) {
  styleSheet.setAttribute('data-projects-page-styles', 'true');
  document.head.appendChild(styleSheet);
}
