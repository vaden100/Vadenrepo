/** One JSON line per event, same shape as the web app's logs. Never log file contents or text. */
export function log(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, unknown> = {},
) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    service: 'worker',
    ...fields,
  });
  if (level === 'error') console.error(line);
  else console.log(line);
}
