/*
  useAuth hook — Ibn Khaldoun University Platform.
  Manages authentication state using React Context (not Redux).
  Works with our cookie-based api.js (credentials: 'include').
*/

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      const data = await authAPI.getMe();
      setUser(data.data?.user ?? data.user ?? data);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      setError('Session expired');
    } finally {
      setLoading(false);
    }
  }, []);

  /* On mount, try to restore session from httpOnly cookie */
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authAPI.login(email, password);
      const loggedUser = data.data?.user ?? data.user;
      setUser(loggedUser);
      setIsAuthenticated(true);

      if (data.data?.requiresPasswordChange || loggedUser?.firstUse) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }

      return { success: true };
    } catch (err) {
      // Handle PASSWORD_CHANGE_REQUIRED from middleware
      if (err.code === 'PASSWORD_CHANGE_REQUIRED') {
        navigate('/change-password');
        return { success: true, requiresPasswordChange: true };
      }
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      /* best-effort */
    }
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const clearError = () => setError(null);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    fetchUser,
    clearError,
  };
};
