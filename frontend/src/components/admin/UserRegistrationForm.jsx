import React, { useState, useEffect } from 'react';
import { Search, Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const UserRegistrationForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    telephone: '',
    sexe: '',
    role: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const availableRoles = [
    { id: 'enseignant', label: 'Enseignant (Teacher)', category: 'teacher' },
    { id: 'etudiant', label: 'Étudiant (Student)', category: 'student' },
    { id: 'admin', label: 'Administrateur', category: 'teacher' },
  ];

  const handleRoleChange = (roleId) => {
    setFormData({ ...formData, role: roleId });
    if (errors.role) {
      setErrors({ ...errors, role: '' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.nom.trim()) {
      newErrors.nom = 'Last name is required';
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'First name is required';
    }

    if (!formData.role) {
      newErrors.role = 'A role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/v1/auth/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('pfe_access_token') || ''}`,
        },
        body: JSON.stringify({
          email: formData.email,
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone || undefined,
          sexe: formData.sexe || undefined,
          roleName: formData.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error?.message || 'Failed to create user');
      }

      const result = await response.json();
      const tempPassword = result?.data?.tempPassword;
      setMessage({
        type: 'success',
        text: tempPassword
          ? `User created! Temporary password: ${tempPassword}`
          : 'User created successfully.',
      });

      // Reset form
      setFormData({
        email: '',
        nom: '',
        prenom: '',
        telephone: '',
        sexe: '',
        role: '',
      });

      if (onSuccess) {
        onSuccess(result?.data || result);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create user',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <Users className="w-8 h-8 text-blue-600" />
        Register New User
      </h2>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border border-edge-strong'
            : 'bg-red-50 border border-edge-strong'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-edge-strong' : 'border-control-border'
            }`}
            placeholder="user@example.com"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors.email}
            </p>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nom ? 'border-edge-strong' : 'border-control-border'
              }`}
              placeholder="Dupont"
            />
            {errors.nom && (
              <p className="text-red-600 text-sm mt-1">{errors.nom}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.prenom ? 'border-edge-strong' : 'border-control-border'
              }`}
              placeholder="Jean"
            />
            {errors.prenom && (
              <p className="text-red-600 text-sm mt-1">{errors.prenom}</p>
            )}
          </div>
        </div>

        {/* Phone and Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-control-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Gender
            </label>
            <select
              name="sexe"
              value={formData.sexe}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-control-border bg-control-bg text-ink rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">—</option>
              <option value="H">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
        </div>

        {/* Role Section (single selection) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            User Role * <span className="text-xs font-normal text-ink-tertiary">(select one)</span>
          </label>

          {errors.role && (
            <p className="text-red-600 text-sm mb-3 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors.role}
            </p>
          )}

          <div className="space-y-2" role="radiogroup" aria-label="User role">
            {availableRoles.map((role) => {
              const selected = formData.role === role.id;
              return (
                <label
                  key={role.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    selected
                      ? 'border-brand bg-brand-light/70'
                      : 'border-edge hover:bg-surface-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="user-role"
                    value={role.id}
                    checked={selected}
                    onChange={() => handleRoleChange(role.id)}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {role.label}
                  </span>
                  <span
                    className={`ml-auto text-xs px-2 py-1 rounded-full ${
                      role.category === 'teacher'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {role.category === 'teacher' ? 'Teacher' : 'Student'}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating User...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Create User
              </>
            )}
          </button>
          <button
            type="reset"
            className="px-6 py-3 border border-edge text-ink-secondary font-semibold rounded-lg hover:bg-surface-200 transition"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Helper Information */}
      <div className="mt-8 p-4 bg-brand-light border border-edge-strong rounded-lg">
        <p className="text-sm text-brand">
          <strong>Note:</strong> Each user has exactly one role. A user is either a teacher (Enseignant), an administrator, or a student (Étudiant).
        </p>
      </div>
    </div>
  );
};

export default UserRegistrationForm;

