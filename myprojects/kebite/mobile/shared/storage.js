import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  token:           'kebite_token',
  cart:            'kebite_cart',
  recentSearches:  'kebite_recent_searches',
  activeOrderCount:'activeOrderCount',
  role:            'kebite_role',
};

export async function getItem(key) {
  try { return await AsyncStorage.getItem(key); }
  catch { return null; }
}

export async function setItem(key, value) {
  try { await AsyncStorage.setItem(key, value); } catch {}
}

export async function removeItem(key) {
  try { await AsyncStorage.removeItem(key); } catch {}
}

export async function getJSON(key, fallback = null) {
  const raw = await getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

export async function setJSON(key, value) {
  await setItem(key, JSON.stringify(value));
}

export async function getToken()   { return getItem(KEYS.token); }
export async function setToken(t)  { return setItem(KEYS.token, t); }
export async function clearToken() { return removeItem(KEYS.token); }

export async function clearAuthData() {
  await Promise.all([
    removeItem(KEYS.token),
    removeItem(KEYS.role),
    removeItem(KEYS.cart),
    removeItem(KEYS.activeOrderCount),
    removeItem(KEYS.recentSearches),
  ]);
}
