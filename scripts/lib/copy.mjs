/**
 * Copy rules (SPEC 6.2) and readability (SPEC 6.1) as pure functions, so they are unit-tested.
 */

// Symbols like (c) and arrows count as emoji to some checkers (SPEC 19.2): write words, use icons.
export const SYMBOLS = /[\p{Extended_Pictographic}©®™←-⇿]/u;

export const BANNED = [
  /\bless fortunate\b/i,
  /\bvoiceless\b/i,
  /\bgive (them|people|you) a voice\b/i,
  /\bvictims?\b/i,
  /\bat-risk youth\b/i,
  /\bunderprivileged\b/i,
  /\bsav(e|es|ed|ing) (lives|them|people|kids|children|youth|families)\b/i,
  /\bevery dollar goes directly\b/i,
  /\bgame-?changer\b/i,
  /\bcutting-edge\b/i,
  /\brevolutionary\b/i,
  /\bleverag(e|es|ed|ing)\b/i,
  /\bsynerg(y|ies)\b/i,
  /\bempower(s|ed|ing|ment)?\b/i,
];

/** Problems in one visible string. `key` is the strings path (a.b.c) or a file location. */
export function copyProblems(key, text) {
  const out = [];
  if (text.includes('—')) out.push('em dash');
  if (SYMBOLS.test(text)) out.push('emoji or symbol');
  for (const re of BANNED) if (re.test(text)) out.push(`banned phrase "${text.match(re)[0]}"`);
  const isHeadingOrAction = /(heading|title)$/i.test(key) || /(^|\.)actions\./.test(key);
  if (isHeadingOrAction && text.includes('!')) out.push('exclamation mark in a heading or button');
  return out;
}

export function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** Flesch-Kincaid grade level. Abbreviations like "S.A.F.E" count as one word. */
export function gradeLevel(text) {
  const clean = text.replace(/\b([A-Z]\.){2,}[A-Z]?\b/g, 'Safe');
  const sentences = Math.max(1, (clean.match(/[.!?]+(\s|$)/g) || []).length);
  const words = clean.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
  if (!words.length) return 0;
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
}

/** Max grade per strings key (SPEC 6.1): 6 for Get help, 8 for other public pages. */
export function maxGradeFor(key) {
  if (/^(help|getHelp)\./.test(key)) return 6;
  return 8;
}

/** Only full-sentence strings are graded; labels are too short to score. */
export function isProse(key) {
  return /(^|\.)(prose|description)$|Prose$|Caption$/.test(key);
}
