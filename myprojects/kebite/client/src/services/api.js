import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kebite_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const onAuthPage = AUTH_PATHS.some((p) => window.location.pathname.startsWith(p));
    if (err.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem('kebite_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
