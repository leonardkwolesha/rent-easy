import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('kebite_token');
    if (token) {
      api.get('/users/me')
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('kebite_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('kebite_token', data.token);
    if (data.user?.role) localStorage.setItem('kebite_role', data.user.role);
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('kebite_token', data.token);
    if (data.user?.role) localStorage.setItem('kebite_role', data.user.role);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('kebite_token', data.token);
    if (data.user?.role) localStorage.setItem('kebite_role', data.user.role);
    setUser(data.user);
    return data;
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
    } catch {}
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kebite_token');
    localStorage.removeItem('kebite_role');
    localStorage.removeItem('kebite_cart');
    localStorage.removeItem('activeOrderCount');
    localStorage.removeItem('kebite_recent_searches');
    window.location.href = '/login';
  };

  const isRole = (r) => user?.role === r;

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, refreshUser, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
