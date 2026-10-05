import { rpc } from './postgrest';

/** Per-route limits (SPEC 9, 11). Buckets are keyed by rule name + client IP. */
export interface RateRule {
  name: string;
  /** Matches the pathname. First matching rule wins. */
  match: RegExp;
  methods?: readonly string[];
  capacity: number;
  refillPerMinute: number;
}

export const RATE_RULES: readonly RateRule[] = [
  // GET /api/search: 30/min/IP (Turnstile after 60/hour arrives with search in Phase 4).
  { name: 'search', match: /^\/api\/search(\/|$)/, capacity: 30, refillPerMinute: 30 },
  {
    name: 'report-submit',
    match: /^\/api\/reports\/[^/]+\/submit$/,
    methods: ['POST'],
    capacity: 5,
    refillPerMinute: 5 / 60,
  },
  {
    name: 'report-media',
    match: /^\/api\/reports\/[^/]+\/media$/,
    methods: ['POST'],
    capacity: 30,
    refillPerMinute: 30 / 60,
  },
  {
    name: 'report-claim',
    match: /^\/api\/reports\/claim$/,
    methods: ['POST'],
    capacity: 10,
    refillPerMinute: 10 / 60,
  },
  {
    name: 'report-write',
    match: /^\/api\/reports(\/|$)/,
    methods: ['POST', 'PATCH'],
    capacity: 60,
    refillPerMinute: 60 / 60,
  },
  {
    name: 'auth',
    match: /^\/(api\/)?auth(\/|$)/,
    methods: ['POST'],
    capacity: 10,
    refillPerMinute: 10 / 10,
  },
  {
    name: 'flags',
    match: /^\/api\/(flags|blocks)$/,
    methods: ['POST'],
    capacity: 20,
    refillPerMinute: 20 / 60,
  },
  {
    name: 'privacy',
    match: /^\/api\/privacy\//,
    methods: ['POST'],
    capacity: 5,
    refillPerMinute: 5 / 60,
  },
  {
    name: 'disputes',
    match: /^\/api\/disputes$/,
    methods: ['POST'],
    capacity: 5,
    refillPerMinute: 5 / 60,
  },
  { name: 'share-card', match: /^\/api\/share-card$/, capacity: 30, refillPerMinute: 30 },
  { name: 'api', match: /^\/api\//, capacity: 120, refillPerMinute: 120 },
];

export function ruleFor(
  pathname: string,
  method: string,
  rules = RATE_RULES,
): RateRule | undefined {
  return rules.find((r) => r.match.test(pathname) && (!r.methods || r.methods.includes(method)));
}

export interface RateDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  take(bucket: string, rule: RateRule): Promise<RateDecision>;
}

/** Postgres token bucket via public.check_rate_limit() (shared across instances). */
export class SupabaseRateLimiter implements RateLimiter {
  constructor(
    private url: string,
    private serviceKey: string,
  ) {}
  async take(bucket: string, rule: RateRule): Promise<RateDecision> {
    const rows = await rpc<{ allowed: boolean; remaining: number; retry_after_seconds: number }[]>(
      this.url,
      this.serviceKey,
      'check_rate_limit',
      { bucket, capacity: rule.capacity, refill_per_minute: rule.refillPerMinute },
    );
    const r = rows[0];
    if (!r) throw new Error('check_rate_limit returned no row');
    return { allowed: r.allowed, remaining: r.remaining, retryAfterSeconds: r.retry_after_seconds };
  }
}

/** Per-instance token bucket for local dev and tests. */
export class MemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, { tokens: number; at: number }>();
  constructor(private now: () => number = Date.now) {}
  async take(bucket: string, rule: RateRule): Promise<RateDecision> {
    const t = this.now();
    const rate = rule.refillPerMinute / 60_000;
    const b = this.buckets.get(bucket) ?? { tokens: rule.capacity, at: t };
    b.tokens = Math.min(rule.capacity, b.tokens + (t - b.at) * rate);
    b.at = t;
    this.buckets.set(bucket, b);
    if (b.tokens >= 1) {
      b.tokens -= 1;
      return { allowed: true, remaining: Math.floor(b.tokens), retryAfterSeconds: 0 };
    }
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((1 - b.tokens) / rate / 1000),
    };
  }
}
