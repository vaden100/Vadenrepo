import { describe, expect, it } from 'vitest';
import { ContactInput, fieldErrors } from './website';

describe('ContactInput', () => {
  const ok = {
    reason: 'press',
    name: ' Dee ',
    email: 'dee@example.com',
    message: 'A message that is long enough to send.',
  };
  it('accepts and trims', () => {
    const r = ContactInput.parse(ok);
    expect(r.name).toBe('Dee');
    expect(r.website).toBe('');
  });
  it('rejects the honeypot, short messages, bad emails and unknown reasons', () => {
    const r = ContactInput.safeParse({
      ...ok,
      website: 'http://spam',
      message: 'short',
      email: 'nope',
      reason: 'sales',
    });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(Object.keys(fieldErrors(r.error)).sort()).toEqual([
        'email',
        'message',
        'reason',
        'website',
      ]);
  });
  it('caps message length', () => {
    expect(ContactInput.safeParse({ ...ok, message: 'x'.repeat(4001) }).success).toBe(false);
  });
});
