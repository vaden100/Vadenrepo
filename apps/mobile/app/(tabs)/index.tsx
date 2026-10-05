import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button, EvidenceSummary } from '@rmmm/ui/native';

export default function LookupScreen() {
  return (
    <Screen
      title="Before you pay, look them up."
      lede="Search a name, @handle, $cashtag, phone, email or website."
    >
      {/* Lookup ships in Phase 4. */}
      <EvidenceSummary state="no_results" />
      <Link href="/styleguide" asChild>
        <Button variant="secondary">Open style guide</Button>
      </Link>
    </Screen>
  );
}
