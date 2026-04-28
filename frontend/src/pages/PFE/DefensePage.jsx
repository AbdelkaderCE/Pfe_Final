import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import pfeAPI from '../../services/pfe';

function localTitle(item) {
  if (!item) return 'Untitled';
  return item.titre_ar || item.titre_en || `PFE #${item.id}`;
}

// Semantic status badge color mapper for defense status
function getStatusColor(status) {
  const statusMap = {
    'upcoming': { bg: 'rgba(202, 138, 4, 0.1)', border: 'rgba(202, 138, 4, 0.3)', text: 'var(--status-warning, #ca8a04)' },
    'ongoing': { bg: 'rgba(29, 78, 216, 0.1)', border: 'rgba(29, 78, 216, 0.3)', text: 'var(--status-info, #1d4ed8)' },
    'completed': { bg: 'rgba(22, 163, 74, 0.1)', border: 'rgba(22, 163, 74, 0.3)', text: 'var(--status-success, #16a34a)' },
  };
  return statusMap[status?.toLowerCase()] || statusMap['upcoming'];
}

function DefenseStatCard({ label, value, status }) {
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
          fontSize: '24px',
          fontWeight: 700,
          color: colors.text,
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}

// High-density defense schedule list item
function DefenseListItem({ defense }) {
  const statusColor = getStatusColor(defense.status);
  const defenseDate = defense.dateSoutenance ? new Date(defense.dateSoutenance) : null;
  const formattedDate = defenseDate ? defenseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
  const formattedTime = defenseDate ? defenseDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

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
      {/* Date Column */}
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
          Date
        </p>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          {formattedDate}
        </p>
        <p
          style={{
            fontSize: '10px',
            color: 'var(--color-ink-secondary)',
            margin: 0,
          }}
        >
          {formattedTime}
        </p>
      </div>

      {/* Group & Subject Column - Flexible */}
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
          {defense.groupTitle || 'Unnamed Group'}
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
          {defense.subjectTitle || 'No subject'}
        </p>
      </div>

      {/* Location Pill */}
      <div
        style={{
          padding: '0 16px',
          minWidth: '100px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderRight: '1px solid var(--color-edge-subtle)',
        }}
      >
        <div
          style={{
            borderRadius: '6px',
            background: 'rgba(107, 114, 128, 0.1)',
            border: '1px solid rgba(107, 114, 128, 0.2)',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-ink-secondary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {defense.salleSoutenance || 'TBD'}
          </p>
        </div>
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
            animation: defense.status === 'ongoing' ? 'pulse 1.5s infinite' : 'none',
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
          {defense.status || 'Upcoming'}
        </span>
      </div>
    </article>
  );
}

export default function DefensePage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await pfeAPI.listSubjects?.();
        setSubjects(response?.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load defense data');
        console.error('Error loading defenses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const defenses = useMemo(() => {
    const items = [];
    subjects.forEach((subject) => {
      (subject.groupsPfe || []).forEach((group) => {
        if (group.dateSoutenance) {
          const defenseDate = new Date(group.dateSoutenance);
          const now = new Date();
          const dayDiff = Math.floor((defenseDate - now) / (1000 * 60 * 60 * 24));
          
          let status = 'upcoming';
          if (dayDiff < 0) status = 'completed';
          else if (dayDiff <= 1) status = 'ongoing';
          
          items.push({
            id: `${subject.id}-${group.id}`,
            subjectTitle: localTitle(subject),
            groupTitle: group.nom_ar || group.nom_en || `Group ${group.id}`,
            dateSoutenance: group.dateSoutenance,
            salleSoutenance: group.salleSoutenance || 'Room TBD',
            note: group.note,
            status,
            daysDiff: dayDiff,
          });
        }
      });
    });
    return items.sort((a, b) => new Date(a.dateSoutenance) - new Date(b.dateSoutenance));
  }, [subjects]);

  const stats = useMemo(() => ({
    total: defenses.length,
    upcoming: defenses.filter(d => d.status === 'upcoming').length,
    ongoing: defenses.filter(d => d.status === 'ongoing').length,
    completed: defenses.filter(d => d.status === 'completed').length,
  }), [defenses]);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-secondary)' }}>
        Loading defenses...
      </div>
    );
  }

  return (
    <div style={{ height: '100%', background: 'transparent', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Hero Section with Stats */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-edge-subtle)', background: 'var(--color-canvas)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-ink)', margin: 0, marginBottom: '8px' }}>
              Defense Schedule
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', margin: 0 }}>
              Track and manage PFE defense sessions
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <DefenseStatCard label="Total Defenses" value={stats.total} status="completed" />
            <DefenseStatCard label="Upcoming" value={stats.upcoming} status="upcoming" />
            <DefenseStatCard label="Ongoing" value={stats.ongoing} status="ongoing" />
            <DefenseStatCard label="Completed" value={stats.completed} status="completed" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', flex: 1, overflow: 'hidden', padding: '24px 28px' }}>
          {/* Defenses List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#dc2626' }}>
                {error}
              </div>
            )}
            {defenses.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-secondary)' }}>
                No defense schedules found
              </div>
            ) : (
              defenses.map(defense => (
                <DefenseListItem key={defense.id} defense={defense} />
              ))
            )}
          </div>

          {/* Sidebar Widgets */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto' }}>
            {/* Timeline Widget */}
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
                Timeline Overview
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-ink-secondary)' }}>This Week</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)', background: 'rgba(202, 138, 4, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {defenses.filter(d => d.daysDiff >= 0 && d.daysDiff <= 7).length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-ink-secondary)' }}>This Month</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)', background: 'rgba(29, 78, 216, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {defenses.filter(d => d.daysDiff >= 0 && d.daysDiff <= 30).length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-ink-secondary)' }}>Past Defenses</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)', background: 'rgba(22, 163, 74, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {defenses.filter(d => d.daysDiff < 0).length}
                  </span>
                </div>
              </div>
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
                { label: 'Projects Overview', path: '/dashboard/projects' },
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
if (typeof document !== 'undefined' && !document.querySelector('[data-defense-page-styles]')) {
  styleSheet.setAttribute('data-defense-page-styles', 'true');
  document.head.appendChild(styleSheet);
}