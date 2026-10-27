import { strings } from '@ns1/i18n';
import { Placeholder } from '@ns1/ui';

/** Shows a fact, or a marked placeholder when we do not have it yet (SPEC 0.3). */
export function FactValue({
  value,
  name,
}: {
  value: string | number | null | undefined;
  name: keyof ReturnType<typeof strings>['placeholder']['names'];
}) {
  const t = strings().placeholder;
  if (value === null || value === undefined || value === '')
    return <Placeholder name={t.names[name]} note={t.needsSource} />;
  return <>{value}</>;
}
