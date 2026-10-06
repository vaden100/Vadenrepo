import { randomBytes } from 'node:crypto';

/** URL slug for an entity: readable name plus a short random suffix (names repeat). */
export const slugify = (name: string) =>
  `${
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'entity'
  }-${randomBytes(2).toString('hex')}`;
