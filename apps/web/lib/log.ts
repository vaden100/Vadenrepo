/**
 * Structured server logs (WBS 80): one JSON line per event with timestamp, severity, event
 * and request id. Known-sensitive keys are redacted before anything is written.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE =
  /pass(word)?|token|secret|authorization|cookie|api[-_]?key|card|cvv|ssn|story|message|email|phone/i;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[depth]';
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        SENSITIVE.test(k) ? '[redacted]' : redact(v, depth + 1),
      ]),
    );
  }
  if (typeof value === 'string' && value.length > 500) return `${value.slice(0, 500)}…`;
  return value;
}

export function log(level: Level, event: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...(redact(fields) as object),
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
