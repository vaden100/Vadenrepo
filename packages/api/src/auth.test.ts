import { describe, expect, it } from 'vitest';
import { isAdult, parseBirthDate, parseOtpTarget, TERMS_VERSION } from './auth';

describe('parseOtpTarget', () => {
  it.each([
    ['tee@Example.com', { kind: 'email', email: 'tee@example.com' }],
    ['(404) 555-0123', { kind: 'phone', phone: '+14045550123' }],
    ['404.555.0123', { kind: 'phone', phone: '+14045550123' }],
    ['+1 404 555 0123', { kind: 'phone', phone: '+14045550123' }],
    ['+44 20 7946 0958', { kind: 'phone', phone: '+442079460958' }],
  ])('%s', (input, want) => expect(parseOtpTarget(input)).toEqual(want));

  it.each(['', 'nope', 'a@b', '555', '@handle'])('rejects %j', (input) => {
    expect(parseOtpTarget(input)).toBeNull();
  });
});

describe('age gate', () => {
  const today = new Date(2026, 9, 5); // Oct 5 2026, local
  it('18th birthday today is adult', () => expect(isAdult('2008-10-05', today)).toBe(true));
  it('one day short is not', () => expect(isAdult('2008-10-06', today)).toBe(false));
  it('rejects impossible dates', () => {
    expect(parseBirthDate('2001-02-30', today)).toBeNull();
    expect(parseBirthDate('2030-01-01', today)).toBeNull();
    expect(isAdult('garbage', today)).toBeNull();
  });
  it('terms version matches the DB format', () =>
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/));
});
