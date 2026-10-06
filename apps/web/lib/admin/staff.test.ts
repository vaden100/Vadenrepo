import { describe, expect, it } from 'vitest';
import { adminIpAllowed, ipInCidr } from './staff';

describe('admin IP allowlist', () => {
  it('is open when no list is set', () => expect(adminIpAllowed('203.0.113.9', '')).toBe(true));
  it('matches addresses and ranges', () => {
    const list = '203.0.113.0/24, 198.51.100.7';
    expect(adminIpAllowed('203.0.113.200', list)).toBe(true);
    expect(adminIpAllowed('198.51.100.7', list)).toBe(true);
    expect(adminIpAllowed('198.51.100.8', list)).toBe(false);
    expect(adminIpAllowed(null, list)).toBe(false);
  });
  it('handles edge masks', () => {
    expect(ipInCidr('10.1.2.3', '0.0.0.0/0')).toBe(true);
    expect(ipInCidr('10.1.2.3', '10.1.2.3/32')).toBe(true);
    expect(ipInCidr('10.1.2.4', '10.1.2.3/32')).toBe(false);
    expect(ipInCidr('10.1.2.3', '10.1.2.3/33')).toBe(false);
  });
});
