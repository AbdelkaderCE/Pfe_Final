import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, AlertCircle, Loader, Download } from 'lucide-react';
import axios from 'axios';
import { Alert, Button, Modal } from '../../design-system/components';

const StaffManagementTable = ({ refreshKey = 0 }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [exportLoading, setExportLoading] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

  // Fetch users on component mount or refresh
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const token = sessionStorage.getItem('pfe_access_token') || '';
        const response = await axios.get(`${API_BASE_URL}/auth/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [refreshKey]);

  // Filter users based on search and role filter
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.prenom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) =>
        user.roles?.includes(roleFilter)
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, users]);

  // Pagination
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  // Handle edit mode
  const startEdit = (user) => {
    setEditingUser(user.id);
    setEditForm({
      email: user.email,
      nom: user.nom || '',
      prenom: user.prenom || '',
      sexe: user.sexe || 'M',
      telephone: user.telephone || '',
      roles: user.roles || [],
    });
  };

  // Save edited user
  const saveEdit = async () => {
    try {
      setError('');
      const token = sessionStorage.getItem('pfe_access_token') || '';

      // Validate role separation
      const hasTeacherRole = editForm.roles.includes('enseignant');
      const hasStudentRole = editForm.roles.includes('etudiant');

      if (hasTeacherRole && hasStudentRole) {
        setError('Cannot assign both teacher and student roles to the same user');
        return;
      }

      await axios.put(
        `${API_BASE_URL}/auth/admin/users/${editingUser}/roles`,
        { userId: editingUser, roleNames: editForm.roles },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage('User updated successfully');
      setEditingUser(null);

      // Refresh user list
      const response = await axios.get(`${API_BASE_URL}/auth/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data?.data || []);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
      console.error('Error updating user:', err);
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    try {
      setError('');
      const token = sessionStorage.getItem('pfe_access_token') || '';

      await axios.put(`${API_BASE_URL}/auth/admin/users/${userId}/status`, {
        userId,
        status: 'suspended',
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccessMessage('User suspended successfully');
      setShowDeleteConfirm(null);

      // Update local list
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: 'suspended' } : u)));

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  // Get role display name
  const getRoleDisplay = (roleNames) => {
    if (!roleNames || roleNames.length === 0) return 'No roles';
    return roleNames.map((r) => {
      const roleMap = {
        enseignant: 'Teacher',
        etudiant: 'Student',
        admin: 'Admin',
      };
      return roleMap[r] || r;
    }).join(', ');
  };

  // Get role badge color
  const getRoleBadgeColor = (roleNames) => {
    if (!roleNames) return 'bg-surface-200 text-ink-secondary border border-edge';
    if (roleNames.includes('admin')) return 'bg-danger/10 text-danger border border-edge-strong';
    if (roleNames.includes('enseignant')) return 'bg-brand-light text-brand border border-edge-strong';
    if (roleNames.includes('etudiant')) return 'bg-success/10 text-success border border-success/30';
    return 'bg-surface-200 text-ink-secondary border border-edge';
  };

  const getDownloadFileName = (contentDisposition, fallbackName) => {
    if (!contentDisposition) return fallbackName;
    const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return fileNameMatch?.[1] || fallbackName;
  };

  const handleExportPdf = async (scope) => {
    try {
      setError('');
      setSuccessMessage('');
      setExportLoading(scope);

      const token = sessionStorage.getItem('pfe_access_token') || '';

      const response = await axios.get(`${API_BASE_URL}/auth/admin/users/export/pdf`, {
        params: { scope },
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const fallbackName = `official-users-${scope}.pdf`;
      const contentDisposition = response.headers['content-disposition'];
      const fileName = getDownloadFileName(contentDisposition, fallbackName);

      const fileBlob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage('PDF export generated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to export PDF');
      console.error('Error exporting users PDF:', err);
    } finally {
      setExportLoading('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-brand animate-spin" />
        <span className="ml-3 text-ink-secondary font-semibold">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" title="Success">
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      <div className="rounded-lg border border-edge bg-surface shadow-card p-6 space-y-4">
        <h3 className="text-base font-semibold text-ink">Official PDF Exports</h3>
        <p className="text-sm text-ink-secondary">
          Generate formal user reports with header, pagination, and department details.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            size="sm"
            loading={exportLoading === 'all'}
            onClick={() => handleExportPdf('all')}
          >
            <Download className="w-4 h-4" />
            Export All Users
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={exportLoading === 'teachers'}
            onClick={() => handleExportPdf('teachers')}
          >
            <Download className="w-4 h-4" />
            Export Teachers
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={exportLoading === 'students'}
            onClick={() => handleExportPdf('students')}
          >
            <Download className="w-4 h-4" />
            Export Students
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-edge bg-surface shadow-card p-6 space-y-4">
        <h3 className="text-base font-semibold text-ink">Filters & Search</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by email, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-control-border bg-control-bg py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-control-border bg-control-bg px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          >
            <option value="all">All Roles</option>
            <option value="enseignant">Teacher</option>
            <option value="etudiant">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="text-sm text-ink-secondary">
          Showing {paginatedUsers.length} of {filteredUsers.length} users
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-edge bg-surface shadow-card overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-ink-muted mx-auto mb-3" />
            <p className="text-ink-secondary font-semibold">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-200 border-b border-edge">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                      Role(s)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge-subtle">
                  {paginatedUsers.map((user) => {
                    const roleNames = user.roles || [];
                    const isEditing = editingUser === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-surface-200 transition-all duration-150">
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="First name"
                                value={editForm.prenom}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, prenom: e.target.value })
                                }
                                className="w-full rounded-md border border-control-border bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                              />
                              <input
                                type="text"
                                placeholder="Last name"
                                value={editForm.nom}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, nom: e.target.value })
                                }
                                className="w-full rounded-md border border-control-border bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                              />
                            </div>
                          ) : (
                            <div className="font-semibold text-ink">
                              {user.prenom} {user.nom}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-ink-secondary">
                          {isEditing ? (
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm({ ...editForm, email: e.target.value })
                              }
                              className="w-full rounded-md border border-control-border bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                            />
                          ) : (
                            user.email
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(
                              roleNames
                            )}`}
                          >
                            {getRoleDisplay(roleNames)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-ink-secondary">
                          {isEditing ? (
                            <input
                              type="tel"
                              value={editForm.telephone}
                              onChange={(e) =>
                                setEditForm({ ...editForm, telephone: e.target.value })
                              }
                              className="w-full rounded-md border border-control-border bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                            />
                          ) : (
                            user.telephone || '-'
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  onClick={saveEdit}
                                  variant="secondary"
                                  size="sm"
                                  className="!h-8"
                                >
                                  Save
                                </Button>
                                <Button
                                  onClick={() => setEditingUser(null)}
                                  variant="ghost"
                                  size="sm"
                                  className="!h-8"
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(user)}
                                  className="rounded-md p-2 text-brand hover:bg-brand-light transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand/30"
                                  title="Edit user"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(user.id)}
                                  className="rounded-md p-2 text-danger hover:bg-danger/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-danger/30"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-surface-200 border-t border-edge px-6 py-4 flex items-center justify-between">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="secondary"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-ink-secondary">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(showDeleteConfirm)}
        onClose={() => setShowDeleteConfirm(null)}
        title="Confirm Delete"
        size="sm"
        footer={(
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={() => deleteUser(showDeleteConfirm)}>
              Delete
            </Button>
          </>
        )}
      >
        <p className="text-sm text-ink-secondary">
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default StaffManagementTable;

