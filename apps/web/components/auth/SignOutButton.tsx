'use client';

import { useRouter } from 'next/navigation';
import { Button, en } from '@rmmm/ui/web';
import { supabaseBrowser } from '@/lib/supabase/browser';

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await supabaseBrowser()?.auth.signOut();
        router.replace('/');
        router.refresh();
      }}
    >
      {en.auth.signOut}
    </Button>
  );
}
