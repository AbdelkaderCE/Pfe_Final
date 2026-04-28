import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Plus,
  Trash2,
  Crown,
  AlertCircle,
  Loader,
  CheckCircle,
} from 'lucide-react';

const StudentAssignmentManager = ({ groupId, onSuccess }) => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [groupLeader, setGroupLeader] = useState(null);

  // Fetch group students on mount
  useEffect(() => {
    if (groupId) {
      fetchGroupStudents();
    }
  }, [groupId]);

  // Fetch available students (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (groupId) {
        searchStudents();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, groupId]);

  const fetchGroupStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/pfe/groups/${groupId}/students`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('pfe_access_token') || ''}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch group students');

      const result = await response.json();
      setAssignedStudents(result.data);

      // Find group leader
      const leader = result.data.find((s) => s.role === 'chef_groupe');
      setGroupLeader(leader);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const searchStudents = async () => {
    if (!groupId) return;

    try {
      const query = new URLSearchParams({
        query: searchQuery,
        groupId: groupId,
        limit: '50',
      });

      const response = await fetch(
        `/api/v1/pfe/groups/students/search?${query}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('pfe_access_token') || ''}`,
          },
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const result = await response.json();
      setStudents(result.data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleSelectStudent = (studentId) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map((s) => s.id)));
    }
  };

  const handleAssignStudents = async () => {
    if (selectedStudents.size === 0) {
      setMessage({ type: 'error', text: 'Please select at least one student' });
      return;
    }

    setAssigning(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(
        `/api/v1/pfe/groups/${groupId}/assign-students`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('pfe_access_token') || ''}`,
          },
          body: JSON.stringify({
            studentIds: Array.from(selectedStudents),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign students');
      }

      const result = await response.json();
      setMessage({
        type: 'success',
        text: `Success! Added: ${result.added}, Already assigned: ${result.updated}`,
      });

      setSelectedStudents(new Set());
      await fetchGroupStudents();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setAssigning(false);
    }
  };

  const removeStudent = async (studentId) => {
    try {
      const response = await fetch(
        `/api/v1/pfe/groups/${groupId}/students/${studentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('pfe_access_token') || ''}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to remove student');

      setMessage({
        type: 'success',
        text: 'Student removed successfully',
      });
      await fetchGroupStudents();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const setLeader = async (studentId) => {
    try {
      const response = await fetch(
        `/api/v1/pfe/groups/${groupId}/leader/${studentId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('pfe_access_token') || ''}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to set group leader');

      setMessage({
        type: 'success',
        text: 'Group leader updated',
      });
      await fetchGroupStudents();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-lg p-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-ink mb-2 flex items-center gap-3">
        <Search className="w-8 h-8 text-brand" />
        Student Assignment Manager
      </h2>
      <p className="text-ink-secondary mb-6">
        Find and assign students to this PFE group
      </p>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-success/5 border border-edge-strong'
              : 'bg-danger/5 border border-edge-strong'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          )}
          <p
            className={
              message.type === 'success' ? 'text-success' : 'text-danger'
            }
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Students */}
        <div>
          <h3 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-success" />
            Available Students
          </h3>

          {/* Search Input */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by name, email, or matricule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-control-border rounded-lg focus:outline-none focus:ring-2 focus:ring-control-focus"
            />
          </div>

          {/* Select All Checkbox */}
          {students.length > 0 && (
            <label className="flex items-center p-2 mb-3 hover:bg-surface-200 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStudents.size === students.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-brand"
              />
              <span className="ml-3 text-sm font-medium text-ink-secondary">
                Select All ({students.length})
              </span>
            </label>
          )}

          {/* Students List */}
          <div className="space-y-2 max-h-96 overflow-y-auto border border-edge rounded-lg p-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-ink-muted animate-spin" />
              </div>
            ) : students.length > 0 ? (
              students.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center p-3 border border-edge rounded hover:bg-surface-200 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.id)}
                    onChange={() => handleSelectStudent(student.id)}
                    className="w-4 h-4 text-brand"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-ink">
                      {student.prenom} {student.nom}
                    </p>
                    <p className="text-sm text-ink-tertiary">{student.email}</p>
                    {student.matricule && (
                      <p className="text-xs text-ink-muted">
                        {student.matricule}
                      </p>
                    )}
                  </div>
                  {student.moyenne && (
                    <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded">
                      {student.moyenne.toFixed(2)}
                    </span>
                  )}
                </label>
              ))
            ) : (
              <p className="text-center text-ink-tertiary py-4">
                {searchQuery ? 'No students found' : 'Search to find students'}
              </p>
            )}
          </div>

          {/* Assign Button */}
          <button
            onClick={handleAssignStudents}
            disabled={selectedStudents.size === 0 || assigning}
            className="w-full mt-4 bg-success text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {assigning ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Assign {selectedStudents.size > 0 ? `(${selectedStudents.size})` : ''}
              </>
            )}
          </button>
        </div>

        {/* Assigned Students */}
        <div>
          <h3 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Assigned Students ({assignedStudents.length})
          </h3>

          {/* Assigned Students List */}
          <div className="space-y-2 max-h-96 overflow-y-auto border border-edge rounded-lg p-3">
            {assignedStudents.length > 0 ? (
              assignedStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border border-edge rounded-lg hover:bg-surface-200 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium text-ink">
                      {student.prenom} {student.nom}
                    </p>
                    <p className="text-sm text-ink-tertiary">{student.email}</p>
                    {student.role === 'chef_groupe' && (
                      <span className="inline-flex mt-1 text-xs bg-warning/10 text-warning px-2 py-1 rounded items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Group Leader
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {student.role !== 'chef_groupe' && (
                      <button
                        onClick={() => setLeader(student.id)}
                        className="p-2 text-warning hover:bg-warning/10 rounded transition"
                        title="Set as group leader"
                      >
                        <Crown className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => removeStudent(student.id)}
                      className="p-2 text-danger hover:bg-danger/10 rounded transition"
                      title="Remove student"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-ink-tertiary py-4">
                No students assigned yet
              </p>
            )}
          </div>

          {/* Summary Card */}
          <div className="mt-4 p-4 bg-brand-light border border-edge-strong rounded-lg">
            <p className="text-sm text-brand">
              <strong>Stats:</strong> {assignedStudents.length} students assigned
              {groupLeader && (
                <span className="block mt-1">
                  Leader: {groupLeader.prenom} {groupLeader.nom}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentManager;

