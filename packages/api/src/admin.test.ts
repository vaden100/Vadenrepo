import { describe, expect, it } from 'vitest';
import { isIpOrCidr, ModerateReport } from './admin';

describe('admin contracts', () => {
  it('accepts IPs and sane ranges only', () => {
    for (const ok of ['203.0.113.7', '203.0.113.0/24', '2001:db8::1', '2001:db8::/32'])
      expect(isIpOrCidr(ok)).toBe(true);
    for (const bad of ['0.0.0.0/0', '203.0.113.0/4', '300.1.1.1', 'abc', '1.2.3.4/24/1', '::/0'])
      expect(isIpOrCidr(bad)).toBe(false);
  });
  it('approving needs an excerpt', () => {
    expect(ModerateReport.safeParse({ action: 'approve', publicExcerpt: ' ' }).success).toBe(false);
    expect(
      ModerateReport.safeParse({ action: 'approve', publicExcerpt: 'Paid, no show.' }).success,
    ).toBe(true);
  });
});
