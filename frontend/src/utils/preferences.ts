import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'home_compact_layout';

export async function getHomeCompact(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';
    }
    const v = await SecureStore.getItemAsync(KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function setHomeCompact(value: boolean): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        if (value) localStorage.setItem(KEY, '1');
        else localStorage.removeItem(KEY);
      }
      return;
    }
    if (value) await SecureStore.setItemAsync(KEY, '1');
    else await SecureStore.deleteItemAsync(KEY);
  } catch { /* ignore */ }
}
