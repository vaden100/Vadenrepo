import type { WhoStep } from '@rmmm/api';
import {
  looseHandle,
  normalizeCashtag,
  normalizeDomain,
  normalizeEmail,
  normalizeHandle,
  normalizeName,
  normalizePhone,
} from '@rmmm/search-core';

type IdentType =
  | 'name'
  | 'handle_ig'
  | 'handle_tiktok'
  | 'handle_fb'
  | 'handle_x'
  | 'cashtag'
  | 'zelle'
  | 'venmo'
  | 'paypal'
  | 'phone'
  | 'email'
  | 'domain';

export interface IdentifierRow {
  field: keyof WhoStep;
  type: IdentType;
  raw: string;
  norm: string;
  norm_loose: string | null;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Step 2 form -> normalized identifiers (SPEC 8.1 rules, so Phase 4 search matches them). */
export function identifiersFromWho(who: Partial<WhoStep>): IdentifierRow[] {
  const rows: IdentifierRow[] = [];
  const add = (
    field: keyof WhoStep,
    type: IdentType,
    raw: string | undefined,
    norm: string | null | undefined,
    loose?: string,
  ) => {
    const r = raw?.trim();
    if (!r || !norm) return;
    rows.push({
      field,
      type,
      raw: r.slice(0, 300),
      norm: norm.slice(0, 300),
      norm_loose: loose ?? null,
    });
  };
  const handle = (field: keyof WhoStep, type: IdentType) => {
    const n = who[field] ? normalizeHandle(who[field]!) : null;
    add(field, type, who[field], n, n ? looseHandle(n) : undefined);
  };
  add(
    'businessName',
    'name',
    who.businessName,
    who.businessName ? normalizeName(who.businessName) : null,
  );
  handle('instagram', 'handle_ig');
  handle('tiktok', 'handle_tiktok');
  handle('facebook', 'handle_fb');
  handle('x', 'handle_x');
  add(
    'phone',
    'phone',
    who.phone,
    who.phone ? (normalizePhone(who.phone) ?? who.phone.replace(/\D/g, '')) : null,
  );
  add('website', 'domain', who.website, who.website ? normalizeDomain(who.website) : null);
  add('cashtag', 'cashtag', who.cashtag, who.cashtag ? normalizeCashtag(who.cashtag) : null);
  if (who.zelle)
    add(
      'zelle',
      'zelle',
      who.zelle,
      isEmail(who.zelle) ? normalizeEmail(who.zelle) : normalizePhone(who.zelle),
    );
  if (who.venmo) add('venmo', 'venmo', who.venmo, who.venmo.trim().replace(/^@/, '').toLowerCase());
  if (who.paypal)
    add(
      'paypal',
      'paypal',
      who.paypal,
      isEmail(who.paypal)
        ? normalizeEmail(who.paypal)
        : who.paypal.trim().replace(/^@/, '').toLowerCase(),
    );
  if (who.appleCash) {
    // Apple Cash runs on a phone number or an Apple ID email.
    add(
      'appleCash',
      isEmail(who.appleCash) ? 'email' : 'phone',
      who.appleCash,
      isEmail(who.appleCash) ? normalizeEmail(who.appleCash) : normalizePhone(who.appleCash),
    );
  }
  return rows;
}
