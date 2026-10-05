import { describe, expect, it } from 'vitest';
import { CaseStatus } from './enums';

describe('enums', () => {
  it('case statuses are the exact set from SPEC 4.4', () => {
    expect(CaseStatus.options).toEqual([
      'reported',
      'verifying',
      'contacted',
      'response_received',
      'no_response',
      'resolved_refunded',
      'resolved_other',
      'closed',
    ]);
  });
});
