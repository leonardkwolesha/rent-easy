import { createContext, useContext, useEffect, useState } from 'react';
import api, { setUnauthorizedHandler } from '../../../shared/api';
import { getToken, setItem, KEYS, clearAuthData } from '../../../shared/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    (async () => {
      const token = await getToken();
      if (!token) { setLoading(false); return; }
      try {
        const res = await api.get('/users/me');
        if (res.data?.role !== 'rider') {
          await clearAuthData();
          setUser(null);
        } else {
          setUser(res.data);
        }
      } catch {
        await clearAuthData();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.user?.role !== 'rider') {
      throw new Error('This account is not a rider account.');
    }
    await setItem(KEYS.token, data.token);
    if (data.user?.role) await setItem(KEYS.role, data.user.role);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', { ...payload, role: 'rider' });
    await setItem(KEYS.token, data.token);
    if (data.user?.role) await setItem(KEYS.role, data.user.role);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await clearAuthData();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
