import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
if (!BACKEND_URL && __DEV__) {
  console.warn('[api] EXPO_PUBLIC_BACKEND_URL is not set. API calls will fail. Set it in your .env file.');
}

const api = axios.create({ baseURL: `${BACKEND_URL}/api`, timeout: 120000 });

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    }
    return await SecureStore.getItemAsync('auth_token');
  } catch { return null; }
}

export async function setToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('auth_token', token);
    } else {
      await SecureStore.setItemAsync('auth_token', token);
    }
  } catch (e) { console.error('Token save error:', e); }
}

export async function removeToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem('auth_token');
    } else {
      await SecureStore.deleteItemAsync('auth_token');
    }
  } catch {}
}

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
