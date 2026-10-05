import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('never exposes the service role key value', () => {
    const c = loadConfig({ SUPABASE_SERVICE_ROLE_KEY: 'secret', PORT: '9000' });
    expect(c).toEqual({ port: 9000, supabaseUrl: undefined, hasServiceRole: true });
    expect(JSON.stringify(c)).not.toContain('secret');
  });
});
