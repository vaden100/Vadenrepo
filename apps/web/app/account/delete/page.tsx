import type { Metadata } from 'next';
import { en } from '@rmmm/ui/web';
import { PageHead } from '@/components/content/PageHead';
import { DeleteRequestForm } from '@/components/forms/DeleteRequestForm';
import { requireSignedIn } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: en.deletion.title, robots: { index: false } };

export default async function DeletePage() {
  const session = await requireSignedIn('/account/delete');
  const supabase = await supabaseServer();
  const { data } = (await supabase
    ?.from('deletion_requests')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('status', 'open')
    .limit(1)) ?? {
    data: null,
  };
  return (
    <div className="container stack-lg">
      <PageHead
        crumbs={[
          { label: en.nav.home, href: '/' },
          { label: en.account.title, href: '/account' },
          { label: en.deletion.title },
        ]}
        title={en.deletion.title}
        lede={en.deletion.lede}
      />
      <section className="prose stack" aria-labelledby="what-happens">
        <h2 id="what-happens">{en.deletion.whatHappens}</h2>
        <ol>
          {en.deletion.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <DeleteRequestForm pending={Boolean(data?.length)} />
      </section>
    </div>
  );
}
