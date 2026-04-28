/*
  UniversalHistoryPage — Admin view for any user's past activity history
  
  Purpose: Unified history view with role-based dynamic tabs (Teacher/Student).
  Theme Safety: 100% token-based (--surface-L1, --surface-L2, --text-primary, --text-muted, --border-subtle).
  Density: High-density rows with consistent grid spacing (8pt base).
  Architecture: Tab-based (state-driven), integrated with existing admin workflow.
*/

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import HistoryRow from '../../components/admin/HistoryRow';

export default function UniversalHistoryPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('Fetching history for userId:', userId);
        const url = `/api/v1/admin/users/${userId}/history`;
        console.log('Endpoint:', url);

        const response = await fetch(url, {
          credentials: 'include',
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', {
          'content-type': response.headers.get('content-type'),
          'content-length': response.headers.get('content-length'),
        });

        // Always try to read the response body
        const responseText = await response.text();
        console.log('Response body:', responseText.substring(0, 200));

        if (!response.ok) {
          console.error('Error response:', response.status, responseText);
          throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 100)}`);
        }

        // Parse the response
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseErr) {
          console.error('Failed to parse JSON:', parseErr);
          console.error('Response text was:', responseText);
          throw new Error(`Invalid JSON response: ${parseErr.message}`);
        }

        setUserData(data.data);

        // Set first tab as active
        if (data.data?.tabs?.length > 0) {
          setActiveTab(data.data.tabs[0].id);
        }
      } catch (err) {
        console.error('Error fetching user history:', err);
        setError(err.message || 'Failed to load user history');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const handleViewItem = (itemId) => {
    // Placeholder for future item detail view
    console.log('View item:', itemId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-brand" />
          <p className="text-sm text-ink-secondary">Loading user history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/dashboard/admin/users')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-200 text-ink-secondary hover:text-ink transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </button>

          <div className="rounded-2xl bg-danger-light dark:bg-danger/8 border border-danger/50 p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-danger mb-1">Error Loading History</h2>
              <p className="text-sm text-danger">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-canvas p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/dashboard/admin/users')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-200 text-ink-secondary hover:text-ink transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </button>

          <div className="text-center py-12">
            <p className="text-ink-secondary">No user data found</p>
          </div>
        </div>
      </div>
    );
  }

  const currentTab = userData.tabs?.find((tab) => tab.id === activeTab);
  const statusBadgeStyle = {
    active: 'bg-brand/8 dark:bg-brand/12 text-brand border border-brand/30',
    inactive: 'bg-surface-200 text-ink-secondary border border-edge-subtle',
    graduated: 'bg-success/8 dark:bg-success/12 text-success border border-success/30',
    suspended: 'bg-danger/8 dark:bg-danger/12 text-danger border border-danger/30',
  };

  const statusClass = statusBadgeStyle[userData.user.status?.toLowerCase()] || statusBadgeStyle.active;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header Navigation */}
      <div className="sticky top-0 z-40 bg-canvas border-b border-edge-subtle">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/dashboard/admin/users')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-200 text-ink-secondary hover:text-ink transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* User Header Card */}
        <div className="rounded-3xl bg-surface border border-edge shadow-card p-8 mb-8">
          <div className="flex flex-col gap-6">
            {/* User Info Grid */}
            <div>
              <div className="flex items-baseline gap-3 mb-4">
                <h1 className="text-3xl font-bold text-ink">{userData.user.name}</h1>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusClass}`}>
                  {userData.user.status || 'Active'}
                </span>
              </div>
              <p className="text-sm text-ink-secondary mb-2">{userData.user.email}</p>
            </div>

            {/* User Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Role Badge */}
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Role</p>
                <div className="px-3 py-2 rounded-lg bg-brand-light dark:bg-brand/8 text-brand border border-brand/30 text-sm font-medium">
                  {userData.user.role === 'teacher' ? 'Teacher' : userData.user.role === 'student' ? 'Student' : 'Admin'}
                </div>
              </div>

              {/* Department (if available) */}
              {userData.user.department && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Department</p>
                  <p className="text-sm text-ink">{userData.user.department}</p>
                </div>
              )}

              {/* Joined Date */}
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Member Since</p>
                <p className="text-sm text-ink">
                  {new Date(userData.user.joinedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        {userData.tabs && userData.tabs.length > 0 && (
          <>
            {/* Tab Buttons */}
            <div className="flex gap-2 mb-8 border-b border-edge-subtle overflow-x-auto">
              {userData.tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'border-b-brand text-brand'
                        : 'border-b-transparent text-ink-secondary hover:text-ink'
                    }`}
                  >
                    {tab.label}
                    {tab.total > 0 && (
                      <span className="ml-2 text-xs font-semibold opacity-60">({tab.total})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {currentTab && (
              <div className="rounded-3xl bg-surface border border-edge shadow-card overflow-hidden">
                {/* Empty State */}
                {(!currentTab.items || currentTab.items.length === 0) && (
                  <div className="p-12 text-center">
                    <p className="text-ink-secondary">No items in this category yet</p>
                  </div>
                )}

                {/* History Rows */}
                {currentTab.items && currentTab.items.length > 0 && (
                  <div role="list" className="divide-y divide-edge-subtle">
                    {currentTab.items.map((item) => (
                      <HistoryRow
                        key={item.id}
                        id={item.id}
                        date={item.date}
                        category={item.category}
                        categoryIcon={
                          currentTab.id === 'disciplinary'
                            ? 'AlertTriangle'
                            : currentTab.id === 'projects'
                            ? 'BookOpen'
                            : currentTab.id === 'documents'
                            ? 'FileText'
                            : currentTab.id === 'reclamations'
                            ? 'FileQuestion'
                            : currentTab.id === 'justifications'
                            ? 'CheckCircle'
                            : currentTab.id === 'pfe-journey'
                            ? 'Briefcase'
                            : 'AlertTriangle'
                        }
                        title={item.title}
                        description={item.description}
                        status={item.status}
                        onView={handleViewItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* No Tabs Message */}
        {(!userData.tabs || userData.tabs.length === 0) && (
          <div className="rounded-3xl bg-surface border border-edge-subtle p-12 text-center">
            <p className="text-ink-secondary">No history available for this user</p>
          </div>
        )}
      </div>
    </div>
  );
}
