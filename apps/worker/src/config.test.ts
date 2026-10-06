import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('never exposes the service role key value', () => {
    const c = loadConfig({
      SUPABASE_SERVICE_ROLE_KEY: 'secret',
      PORT: '9000',
      TRANSCRIBE_API_KEY: 'tk',
      TRANSCRIBE_API_URL: 'https://x',
    });
    expect(c).toMatchObject({
      port: 9000,
      supabaseUrl: undefined,
      hasServiceRole: true,
      storageDriver: 'supabase',
    });
    expect(JSON.stringify(c)).not.toContain('secret');
    expect(JSON.stringify(c)).not.toContain('tk"');
  });
  it('defaults to local storage and no optional services', () => {
    const c = loadConfig({});
    expect(c).toMatchObject({ storageDriver: 'local', clamav: null, ocr: false, transcribe: null });
  });
});
