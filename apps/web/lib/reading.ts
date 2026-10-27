/**
 * Reading settings (SPEC 11): stored in this browser only, applied as attributes on <html>.
 * Plain module (no 'use client') so the server layout can embed the init script.
 */
export const READING_KEY = 'ns1-reading';

export interface ReadingSettings {
  textSize: 'normal' | 'large' | 'larger';
  spacing: boolean;
  motion: boolean;
  contrast: boolean;
  theme: 'system' | 'light' | 'dark';
}

export const defaultReading: ReadingSettings = {
  textSize: 'normal',
  spacing: false,
  motion: false,
  contrast: false,
  theme: 'system',
};

type Target = { dataset: Record<string, string | undefined> };

/** Applies settings to the root element. Mirrors READING_INIT_SCRIPT exactly. */
export function applyReading(root: Target, s: Partial<ReadingSettings>): void {
  const set = (k: string, v: string | false) => {
    if (v) root.dataset[k] = v;
    else delete root.dataset[k];
  };
  set('textSize', s.textSize && s.textSize !== 'normal' ? s.textSize : false);
  set('spacing', s.spacing ? 'wide' : false);
  set('motion', s.motion ? 'reduce' : false);
  set('contrast', s.contrast ? 'more' : false);
  set('theme', s.theme && s.theme !== 'system' ? s.theme : false);
}

export function readReading(storage: Pick<Storage, 'getItem'> | undefined): ReadingSettings {
  try {
    const raw = storage?.getItem(READING_KEY);
    return { ...defaultReading, ...(raw ? (JSON.parse(raw) as Partial<ReadingSettings>) : {}) };
  } catch {
    return defaultReading;
  }
}

/**
 * Runs before first paint (nonce'd inline script in <head>) so settings never flash.
 * Kept in sync with applyReading by reading.test.ts.
 */
export const READING_INIT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  READING_KEY,
)})||'{}');var d=document.documentElement.dataset;if(s.textSize&&s.textSize!=='normal')d.textSize=s.textSize;if(s.spacing)d.spacing='wide';if(s.motion)d.motion='reduce';if(s.contrast)d.contrast='more';if(s.theme&&s.theme!=='system')d.theme=s.theme;}catch(e){}})();`;
