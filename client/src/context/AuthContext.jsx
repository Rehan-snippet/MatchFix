import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('matchfix_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/users/me');
      setUser(data);
    } catch {
      localStorage.removeItem('matchfix_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('matchfix_token', data.token);
    setUser(data.user);
    await loadMe(); // pull the full profile including role sub-records
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('matchfix_token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('matchfix_token');
    setUser(null);
  }

  // Call after becoming a new role so both the profile view AND the JWT
  // (used for requireRole checks on protected endpoints) reflect it,
  // without forcing the user to log out and back in.
  async function refreshProfile() {
    try {
      const { data } = await api.post('/auth/refresh');
      localStorage.setItem('matchfix_token', data.token);
    } catch {
      // token refresh is best-effort; the user can still re-login manually
    }
    await loadMe();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
