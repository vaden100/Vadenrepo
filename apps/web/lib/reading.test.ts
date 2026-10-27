import { describe, expect, it } from 'vitest';
import {
  applyReading,
  defaultReading,
  READING_INIT_SCRIPT,
  READING_KEY,
  readReading,
  type ReadingSettings,
} from './reading';

function runInit(stored: string | null) {
  const root = { dataset: {} as Record<string, string | undefined> };
  const doc = { documentElement: root };
  const storage = { getItem: (k: string) => (k === READING_KEY ? stored : null) };
  new Function('document', 'localStorage', READING_INIT_SCRIPT)(doc, storage);
  return root.dataset;
}

const cases: ReadingSettings[] = [
  defaultReading,
  { textSize: 'larger', spacing: true, motion: true, contrast: true, theme: 'dark' },
  { textSize: 'large', spacing: false, motion: true, contrast: false, theme: 'light' },
];

describe('reading settings', () => {
  it.each(cases)('init script matches applyReading for %o', (s) => {
    const root = { dataset: {} as Record<string, string | undefined> };
    applyReading(root, s);
    expect(runInit(JSON.stringify(s))).toEqual(root.dataset);
  });
  it('survives bad storage', () => {
    expect(runInit('{not json')).toEqual({});
    expect(readReading({ getItem: () => '{oops' })).toEqual(defaultReading);
    expect(readReading(undefined)).toEqual(defaultReading);
  });
  it('clears attributes when turned off', () => {
    const root = { dataset: {} as Record<string, string | undefined> };
    applyReading(root, cases[1]!);
    applyReading(root, defaultReading);
    expect(root.dataset).toEqual({});
  });
});
