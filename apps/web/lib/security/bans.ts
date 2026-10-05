import { rpc } from './postgrest';
import { TtlCache } from './ttl-cache';

export interface BanStore {
  isBanned(ip: string | null, deviceHash: string | null): Promise<boolean>;
}

/** Checks public.is_banned() (IP/CIDR with expiry + device bans) with a short cache. */
export class SupabaseBanStore implements BanStore {
  private cache: TtlCache<boolean>;
  constructor(
    private url: string,
    private serviceKey: string,
    ttlMs: number,
  ) {
    this.cache = new TtlCache(ttlMs);
  }

  async isBanned(ip: string | null, deviceHash: string | null): Promise<boolean> {
    if (!ip && !deviceHash) return false;
    const key = `${ip ?? ''}|${deviceHash ?? ''}`;
    const hit = this.cache.get(key);
    if (hit !== undefined) return hit;
    const banned = await rpc<boolean>(this.url, this.serviceKey, 'is_banned', {
      ip,
      device_hash: deviceHash,
    });
    this.cache.set(key, banned);
    return banned;
  }
}

/** Fixed list, for tests and local development. */
export class StaticBanStore implements BanStore {
  constructor(
    private ips: Set<string> = new Set(),
    private devices: Set<string> = new Set(),
  ) {}
  async isBanned(ip: string | null, deviceHash: string | null) {
    return (
      (ip !== null && this.ips.has(ip)) || (deviceHash !== null && this.devices.has(deviceHash))
    );
  }
}
