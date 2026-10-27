import { format, strings } from '@ns1/i18n';
import { facts } from '@/content/facts';
import { FactValue } from './Fact';

/** The next session: the winter-break note, the date, or a placeholder (docs/facts.md). */
export function NextSession() {
  const status = facts.sessionStatus.value;
  if (status.paused) return <>{format(strings().rsvp.nextPaused, { year: status.returnYear })}</>;
  return <FactValue value={facts.nextSession.value} name="nextSession" />;
}
