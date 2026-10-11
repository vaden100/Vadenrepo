import { describe, expect, it } from 'vitest';
import { hostOf } from './search';

describe('hostOf', () => {
  it('keeps the full host, drops www, scheme, path and case', () => {
    expect(hostOf('https://WWW.Login-CashApp.weeblysite.com/pay?x=1')).toBe(
      'login-cashapp.weeblysite.com',
    );
    expect(hostOf('shop.example.com')).toBe('shop.example.com');
    expect(hostOf('not a url at all')).toBe(null);
  });
});
