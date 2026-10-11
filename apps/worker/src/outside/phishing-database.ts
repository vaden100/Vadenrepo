/**
 * Phishing.Database (MIT, github.com/Phishing-Database/Phishing.Database): hosts currently
 * serving phishing pages, retested regularly by the project. We keep only well-formed
 * hostnames; anything else in the file is skipped, never guessed at.
 */
export const SOURCE = 'phishing_database';
export const LIST_URL =
  'https://raw.githubusercontent.com/Phishing-Database/Phishing.Database/master/phishing-domains-ACTIVE.txt';

const HOST = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/;

export function parseHosts(text: string): string[] {
  const out = new Set<string>();
  for (const line of text.split('\n')) {
    const h = line.trim().toLowerCase().replace(/\.$/, '');
    if (!h || h.startsWith('#')) continue;
    if (HOST.test(h)) out.add(h);
  }
  return [...out];
}
