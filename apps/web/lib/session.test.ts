import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ supabaseServer: async () => null }));
const { safeNext } = await import('./session');

describe('safeNext', () => {
  it.each([
    ['/account', '/account'],
    ['/cases/x?y=1', '/cases/x?y=1'],
    ['//evil.example', '/account'],
    ['/\\evil.example', '/account'],
    ['https://evil.example', '/account'],
    [undefined, '/account'],
  ])('%j -> %j', (input, want) => expect(safeNext(input)).toBe(want));
});
