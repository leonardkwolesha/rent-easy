import axios from 'axios';
import { Platform } from 'react-native';
import { getToken, clearAuthData } from './storage';

const DEFAULT_HOST = Platform.select({
  android: 'http://10.0.2.2:5000',
  ios:     'http://localhost:5000',
  default: 'http://localhost:5000',
});

const RAW_HOST = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_HOST)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

export const API_BASE   = `${RAW_HOST}/api`;
export const SOCKET_URL = RAW_HOST;

const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await clearAuthData();
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export default api;
