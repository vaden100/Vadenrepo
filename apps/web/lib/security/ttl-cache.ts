/** Small bounded TTL cache for per-instance lookups (ban checks). */
export class TtlCache<V> {
  private map = new Map<string, { value: V; expires: number }>();
  constructor(
    private ttlMs: number,
    private maxEntries = 10_000,
    private now: () => number = Date.now,
  ) {}

  get(key: string): V | undefined {
    if (this.ttlMs <= 0) return undefined;
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expires <= this.now()) {
      this.map.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V): void {
    if (this.ttlMs <= 0) return;
    if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expires: this.now() + this.ttlMs });
  }
}
