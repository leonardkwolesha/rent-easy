import AsyncStorage from '@react-native-async-storage/async-storage';

export const setToken = (token) => AsyncStorage.setItem('rp_token', token);
export const getToken = () => AsyncStorage.getItem('rp_token');
export const removeToken = () => AsyncStorage.removeItem('rp_token');
export const setUser = (user) => AsyncStorage.setItem('rp_user', JSON.stringify(user));
export const getUser = async () => { const u = await AsyncStorage.getItem('rp_user'); return u ? JSON.parse(u) : null; };
export const removeUser = () => AsyncStorage.removeItem('rp_user');
