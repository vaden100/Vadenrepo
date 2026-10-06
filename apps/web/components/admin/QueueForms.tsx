'use client';

import { useState } from 'react';
import { DISPUTE_OUTCOMES, FLAG_ACTIONS, isIpOrCidr } from '@rmmm/api';
import { Button, en, SelectField, StatusMessage, TextArea, TextField } from '@rmmm/ui/web';
import { useAdminAction } from './useAdminAction';

export function ResolveFlagForm({ id }: { id: string }) {
  const t = en.admin.flags;
  const { run, busy, error } = useAdminAction();
  const [action, setAction] = useState('');
  const [note, setNote] = useState('');
  return (
    <div className="stack">
      {error && <StatusMessage tone="error" title={error} />}
      <SelectField
        name={`action-${id}`}
        label={t.action}
        value={action}
        onChange={(e) => setAction(e.target.value)}
        placeholder={en.forms.chooseOne}
        options={FLAG_ACTIONS.map((a) => ({ value: a, label: t.actions[a] ?? a }))}
      />
      <TextArea
        name={`note-${id}`}
        label={t.note}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={2000}
        rows={2}
      />
      <div>
        <Button
          disabled={busy || !action}
          onClick={() => run('PATCH', `/api/admin/flags/${id}`, { action, resolution: note })}
        >
          {t.resolve}
        </Button>
      </div>
    </div>
  );
}

export function DisputeForm({
  id,
  status,
  note: initialNote,
}: {
  id: string;
  status: string;
  note: string;
}) {
  const t = en.admin.disputes;
  const { run, busy, error } = useAdminAction();
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState(initialNote);
  if (status === 'resolved') return null;
  return (
    <div className="stack">
      {error && <StatusMessage tone="error" title={error} />}
      <TextArea
        name={`dnote-${id}`}
        label={en.admin.report.staffNote}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={4000}
        rows={3}
      />
      <div className="row row--end">
        {status === 'open' && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              run('PATCH', `/api/admin/disputes/${id}`, { status: 'in_review', staffNote: note })
            }
          >
            {t.startReview}
          </Button>
        )}
        <SelectField
          name={`outcome-${id}`}
          label={t.outcome}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder={en.forms.chooseOne}
          options={DISPUTE_OUTCOMES.map((o) => ({ value: o, label: t.outcomes[o] ?? o }))}
        />
        <Button
          disabled={busy || !outcome}
          onClick={() =>
            run('PATCH', `/api/admin/disputes/${id}`, {
              status: 'resolved',
              outcome,
              staffNote: note,
            })
          }
        >
          {t.resolve}
        </Button>
      </div>
    </div>
  );
}

export function AddBansForm() {
  const t = en.admin.bans;
  const { run, busy, error, done } = useAdminAction();
  const [text, setText] = useState('');
  const [reason, setReason] = useState('');
  const [days, setDays] = useState('');
  const [invalid, setInvalid] = useState<string | null>(null);
  const submit = async () => {
    const addresses = text
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const bad = addresses.find((a) => !isIpOrCidr(a));
    if (bad) return setInvalid(t.invalid(bad));
    setInvalid(null);
    const r = await run<{ added: number }>('POST', '/api/admin/bans', {
      addresses,
      reason,
      days: days ? Number(days) : null,
    });
    if (r) setText('');
  };
  return (
    <div className="stack form">
      {(invalid || error) && <StatusMessage tone="error" title={invalid ?? error} />}
      {done && <StatusMessage tone="success" title={done} />}
      <TextArea
        name="addresses"
        label={t.addresses}
        description={t.addressesHint}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
      />
      <TextField
        name="reason"
        label={t.reason}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={200}
      />
      <TextField
        name="days"
        label={t.days}
        inputMode="numeric"
        value={days}
        onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))}
        maxLength={4}
      />
      <div>
        <Button variant="danger" disabled={busy || !text.trim() || !reason.trim()} onClick={submit}>
          {t.submit}
        </Button>
      </div>
    </div>
  );
}

export function LiftBanButton({ id, kind }: { id: string; kind: 'ip' | 'device' }) {
  const { run, busy } = useAdminAction();
  return (
    <Button
      variant="text"
      disabled={busy}
      onClick={() => run('DELETE', `/api/admin/bans/${encodeURIComponent(id)}?kind=${kind}`)}
    >
      {en.admin.bans.lift}
    </Button>
  );
}

export function AccountBanForm() {
  const t = en.admin.bans;
  const { run, busy, error, done } = useAdminAction();
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  return (
    <div className="stack form">
      {error && <StatusMessage tone="error" title={error} />}
      {done && <StatusMessage tone="success" title={done} />}
      <TextField
        name="userId"
        label={t.accountId}
        value={userId}
        onChange={(e) => setUserId(e.target.value.trim())}
        maxLength={36}
      />
      <TextField
        name="accountReason"
        label={t.reason}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={200}
      />
      <div className="row">
        <Button
          variant="danger"
          disabled={busy || userId.length !== 36}
          onClick={() =>
            run(
              'POST',
              '/api/admin/accounts',
              { userId, reason, banned: true },
              en.admin.report.saved,
            )
          }
        >
          {t.banAccount}
        </Button>
        <Button
          variant="secondary"
          disabled={busy || userId.length !== 36}
          onClick={() =>
            run(
              'POST',
              '/api/admin/accounts',
              { userId, reason, banned: false },
              en.admin.report.saved,
            )
          }
        >
          {t.unbanAccount}
        </Button>
      </div>
    </div>
  );
}
