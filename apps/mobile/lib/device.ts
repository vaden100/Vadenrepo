import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY = 'rmmm.install_id';
let cached: string | null = null;

/**
 * Random per-install id, kept in the keychain. Sent as `x-rmmm-device`; the server only
 * ever stores a hash of it (SPEC 11 device bans). Not an ad identifier.
 */
export async function installId(): Promise<string> {
  if (cached) return cached;
  cached = await SecureStore.getItemAsync(KEY);
  if (!cached) {
    cached = Crypto.randomUUID();
    await SecureStore.setItemAsync(KEY, cached);
  }
  return cached;
}
