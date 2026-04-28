import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import request from '../../services/api';
import { normalizeApiError } from './SharedPFEUI';
import AdminPFE from './AdminPFE';
import TeacherPFE from './TeacherPFE';
import StudentPFE from './StudentPFE';

export default function PFEWorkspacePage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('subjects');
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { isAdmin, isTeacher, isStudent, teacherProfileId } = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    return {
      isAdmin: roles.includes('admin'),
      isTeacher: roles.includes('enseignant'),
      isStudent: roles.includes('etudiant'),
      teacherProfileId: user?.enseignant?.id ?? null,
    };
  }, [user]);

  const loadSubjects = useCallback(async () => {
    if (authLoading) return;
    const endpoint = isStudent
      ? '/api/v1/pfe/sujets?status=valide'
      : isTeacher && teacherProfileId
      ? `/api/v1/pfe/sujets?enseignantId=${teacherProfileId}`
      : '/api/v1/pfe/sujets';
    try {
      setLoading(true);
      setError(null);
      const res = await request(endpoint);
      setSubjects(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(normalizeApiError(err));
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isStudent, isTeacher, teacherProfileId]);

  const loadGroups = useCallback(async () => {
    if (authLoading) return;
    try {
      setLoading(true);
      setError(null);
      const res = await request('/api/v1/pfe/groupes');
      setGroups(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(normalizeApiError(err));
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading]);

  useEffect(() => {
    setError(null);
    if (activeTab === 'subjects' || activeTab === 'groups') {
      loadSubjects();
      loadGroups();
    }
  }, [activeTab, loadSubjects, loadGroups]);

  const handleValidate = async (sujetId) => {
    try {
      await request(`/api/v1/pfe/sujets/${sujetId}/valider`, {
        method: 'PUT',
        body: JSON.stringify({ adminId: user?.id }),
      });
      loadSubjects();
    } catch (err) {
      setError(normalizeApiError(err));
    }
  };

  const handleReject = async (sujetId) => {
    try {
      await request(`/api/v1/pfe/sujets/${sujetId}/refuser`, {
        method: 'PUT',
        body: JSON.stringify({ adminId: user?.id }),
      });
      loadSubjects();
    } catch (err) {
      setError(normalizeApiError(err));
    }
  };

  const retryActiveTab = useCallback(() => {
    if (activeTab === 'subjects' || activeTab === 'groups') {
      loadSubjects();
      loadGroups();
    }
  }, [activeTab, loadSubjects, loadGroups]);

  if (authLoading) return null;

  if (isAdmin) {
    return <AdminPFE activeTab={activeTab} setActiveTab={setActiveTab} subjects={subjects} groups={groups} loading={loading} error={error} user={user} retryActiveTab={retryActiveTab} handleValidate={handleValidate} handleReject={handleReject} />;
  }

  if (isTeacher) {
    return <TeacherPFE activeTab={activeTab} setActiveTab={setActiveTab} subjects={subjects} groups={groups} loading={loading} error={error} user={user} retryActiveTab={retryActiveTab} />;
  }

  if (isStudent) {
    return <StudentPFE activeTab={activeTab} setActiveTab={setActiveTab} subjects={subjects} groups={groups} loading={loading} error={error} user={user} retryActiveTab={retryActiveTab} />;
  }

  return <div>Access Denied</div>;
}
