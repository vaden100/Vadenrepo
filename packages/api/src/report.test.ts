import { describe, expect, it } from 'vitest';
import {
  amountToCents,
  centsToAmount,
  ClaimInput,
  formatClaimCode,
  hasIdentifier,
  kindForMime,
  MEDIA_RULES,
  MoneyStep,
  ReportDraft,
  SubmitInput,
} from './report';

describe('report contracts', () => {
  it('maps mimes to kinds, rejects everything else', () => {
    expect(kindForMime('image/jpeg')).toBe('image');
    expect(kindForMime('audio/webm;codecs=opus')).toBe('audio');
    expect(kindForMime('application/pdf')).toBe('pdf');
    expect(kindForMime('video/mp4')).toBe('video');
    expect(kindForMime('application/x-msdownload')).toBeNull();
    expect(kindForMime('text/html')).toBeNull();
  });
  it('size limits match SPEC 11', () => {
    expect(MEDIA_RULES.image.maxBytes).toBe(15 * 1024 * 1024);
    expect(MEDIA_RULES.audio.maxBytes).toBe(20 * 1024 * 1024);
    expect(MEDIA_RULES.video.maxBytes).toBe(200 * 1024 * 1024);
  });
  it('requires at least one identifier', () => {
    expect(hasIdentifier({})).toBe(false);
    expect(hasIdentifier({ city: 'Atlanta' })).toBe(false);
    expect(hasIdentifier({ cashtag: '$x' })).toBe(true);
  });
  it('money amounts are exact cents', () => {
    expect(amountToCents('75')).toBe(7500);
    expect(amountToCents('75.5')).toBe(7550);
    expect(amountToCents('1240.99')).toBe(124099);
    expect(centsToAmount(7550)).toBe('75.50');
    expect(centsToAmount(7500)).toBe('75');
    expect(MoneyStep.safeParse({ amount: '12.345' }).success).toBe(false);
    expect(MoneyStep.safeParse({ amount: '-5' }).success).toBe(false);
  });
  it('drafts reject unknown fields and over-long stories', () => {
    expect(ReportDraft.safeParse({ status: 'approved' }).success).toBe(false);
    expect(ReportDraft.safeParse({ story: 'x'.repeat(5001) }).success).toBe(false);
  });
  it('required consents must be explicitly true', () => {
    expect(
      SubmitInput.safeParse({ consentTruth: true, consentTerms: true, ageConfirmed: true }).success,
    ).toBe(true);
    expect(
      SubmitInput.safeParse({ consentTruth: true, consentTerms: false, ageConfirmed: true })
        .success,
    ).toBe(false);
    expect(SubmitInput.safeParse({ consentTerms: true, ageConfirmed: true }).success).toBe(false);
  });
  it('claim codes are unambiguous and validated', () => {
    const code = formatClaimCode(new Uint8Array(Array.from({ length: 12 }, (_, i) => i * 17)));
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(code).not.toMatch(/[01ILO]/);
    expect(ClaimInput.safeParse({ code: 'rmmm-26-0412', claim: code.toLowerCase() }).success).toBe(
      true,
    );
    expect(ClaimInput.safeParse({ code: 'RMMM-26-0412', claim: 'AAAA-AAAA' }).success).toBe(false);
  });
});
