import * as SecureStore from 'expo-secure-store';

/**
 * Supabase session storage on the device keychain/keystore. SecureStore values are
 * limited to ~2 KB, and sessions are larger, so values are split into chunks.
 */
const CHUNK = 1800;
const countKey = (k: string) => `${k}.n`;
const safe = (k: string) => k.replace(/[^A-Za-z0-9._-]/g, '_');

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const k = safe(key);
    const n = Number(await SecureStore.getItemAsync(countKey(k)));
    if (!n) return null;
    const parts = await Promise.all(
      Array.from({ length: n }, (_, i) => SecureStore.getItemAsync(`${k}.${i}`)),
    );
    return parts.some((p) => p === null) ? null : parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    const k = safe(key);
    await secureStorage.removeItem(key);
    const n = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < n; i++)
      await SecureStore.setItemAsync(`${k}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    await SecureStore.setItemAsync(countKey(k), String(n));
  },
  async removeItem(key: string): Promise<void> {
    const k = safe(key);
    const n = Number(await SecureStore.getItemAsync(countKey(k)));
    for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(`${k}.${i}`);
    await SecureStore.deleteItemAsync(countKey(k));
  },
};
