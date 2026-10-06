'use client';

import { useState, type FormEvent } from 'react';
import { Button, Checkbox, en, StatusMessage } from '@rmmm/ui/web';
import { postJson } from './submit';

export function DeleteRequestForm({ pending }: { pending: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'pending'>(
    pending ? 'pending' : 'idle',
  );

  if (state === 'pending') return <StatusMessage tone="info" title={en.deletion.pending} />;
  if (state === 'done') {
    return (
      <StatusMessage tone="success" title={en.deletion.doneTitle}>
        <p>{en.deletion.doneBody}</p>
      </StatusMessage>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    if (!confirm) return setError(en.deletion.errConfirm);
    setError(null);
    setState('sending');
    const r = await postJson('/api/privacy/delete', { confirm: true });
    if (r.ok) return setState('done');
    if (!r.ok && r.kind === 'conflict') return setState('pending');
    setState('idle');
    setError(r.message);
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <Checkbox
        label={en.deletion.confirm}
        checked={confirm}
        onChange={(e) => {
          setConfirm(e.target.checked);
          if (e.target.checked) setError(null);
        }}
        error={error}
      />
      <div>
        <Button
          type="submit"
          variant="danger"
          loading={state === 'sending'}
          loadingLabel={en.forms.sending}
        >
          {en.deletion.submit}
        </Button>
      </div>
    </form>
  );
}
