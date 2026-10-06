'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BAN_DAYS, REJECT_REASONS } from '@rmmm/api';
import { Button, en, SelectField, StatusMessage, TextArea, TextField } from '@rmmm/ui/web';
import { requestJson } from '@/components/forms/submit';
import { useAdminAction } from './useAdminAction';

const t = en.admin.report;

/** Queue moves, evidence request, excerpt + approve, reject, internal note (SPEC 10.2, 10.3). */
export function ModerationPanel({
  id,
  status,
  excerpt: initialExcerpt,
  note: initialNote,
  evidenceRequest,
  canModerate,
}: {
  id: string;
  status: string;
  excerpt: string;
  note: string;
  evidenceRequest: string;
  canModerate: boolean;
}) {
  const { run, busy, error, done } = useAdminAction();
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [note, setNote] = useState(initialNote);
  const [ask, setAsk] = useState(evidenceRequest);
  const [reason, setReason] = useState('');
  const url = `/api/admin/reports/${id}`;
  if (!canModerate) return <p className="muted">{en.admin.errors.forbidden}</p>;
  return (
    <div className="stack">
      {error && <StatusMessage tone="error" title={error} />}
      {done && <StatusMessage tone="success" title={done} />}
      <div className="row">
        {status !== 'triage' && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => run('PATCH', url, { action: 'triage' })}
          >
            {t.triage}
          </Button>
        )}
        {status !== 'ready_for_review' && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => run('PATCH', url, { action: 'ready' })}
          >
            {t.ready}
          </Button>
        )}
      </div>

      <TextArea
        name="evidenceRequest"
        label={t.evidenceRequest}
        description={t.evidenceRequestHint}
        value={ask}
        onChange={(e) => setAsk(e.target.value)}
        maxLength={1000}
        rows={3}
      />
      <div>
        <Button
          variant="secondary"
          disabled={busy || !ask.trim()}
          onClick={() => run('PATCH', url, { action: 'request_evidence', evidenceRequest: ask })}
        >
          {t.requestEvidence}
        </Button>
      </div>

      <TextArea
        name="publicExcerpt"
        label={t.publicExcerpt}
        description={t.publicExcerptHint}
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        maxLength={1200}
        showCount
        rows={4}
      />
      <div className="row">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => run('PATCH', url, { action: 'excerpt', publicExcerpt: excerpt }, t.saved)}
        >
          {t.saveExcerpt}
        </Button>
        <Button
          disabled={busy || !excerpt.trim()}
          onClick={() => run('PATCH', url, { action: 'approve', publicExcerpt: excerpt })}
        >
          {t.approve}
        </Button>
      </div>

      <div className="row row--end">
        <SelectField
          name="rejectedReason"
          label={t.rejectReason}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={en.forms.chooseOne}
          options={REJECT_REASONS.map((r) => ({ value: r, label: t.rejectReasons[r] ?? r }))}
        />
        <Button
          variant="danger"
          disabled={busy || !reason}
          onClick={() => run('PATCH', url, { action: 'reject', rejectedReason: reason })}
        >
          {t.reject}
        </Button>
      </div>

      <TextArea
        name="staffNote"
        label={t.staffNote}
        description={t.staffNoteHint}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={4000}
        rows={3}
      />
      <div>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => run('PATCH', url, { action: 'note', staffNote: note }, t.saved)}
        >
          {t.saveNote}
        </Button>
      </div>
    </div>
  );
}

interface EntityHit {
  id: string;
  display_name: string;
  city: string | null;
  state: string | null;
  is_public: boolean;
}

/** Create an entity from the report or link it to an existing one. Never publishes. */
export function EntityPanel({
  reportId,
  suggestedName,
  linked,
  canModerate,
}: {
  reportId: string;
  suggestedName: string;
  linked: { id: string; name: string; isPublic: boolean }[];
  canModerate: boolean;
}) {
  const { run, busy, error } = useAdminAction();
  const [name, setName] = useState(suggestedName);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<EntityHit[]>([]);
  const url = `/api/admin/reports/${reportId}/entity`;
  const search = async () => {
    const r = await requestJson<{ entities: EntityHit[] }>(
      'GET',
      `/api/admin/entities?q=${encodeURIComponent(q)}`,
    );
    if (r.ok) setHits(r.data.entities);
  };
  return (
    <div className="stack">
      {error && <StatusMessage tone="error" title={error} />}
      {linked.length > 0 && (
        <ul className="admin-list">
          {linked.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/entities/${e.id}`}>{e.name}</Link>{' '}
              <span className="pill">
                {e.isPublic ? en.admin.entity.public : en.admin.entity.notPublic}
              </span>
              {canModerate && (
                <Button
                  variant="text"
                  disabled={busy}
                  onClick={() => run('DELETE', `${url}?entityId=${e.id}`)}
                >
                  {t.unlink}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canModerate && (
        <>
          <div className="row row--end">
            <TextField
              name="entityName"
              label={t.entityName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
            <Button
              disabled={busy || !name.trim()}
              onClick={() => run('POST', url, { displayName: name.trim() })}
            >
              {t.createEntity}
            </Button>
          </div>
          <div className="row row--end">
            <TextField
              name="entitySearch"
              label={t.searchEntities}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={80}
            />
            <Button variant="secondary" onClick={search}>
              {en.admin.bans.search}
            </Button>
          </div>
          {hits.length > 0 && (
            <ul className="admin-list" aria-label={t.linkEntity}>
              {hits.map((h) => (
                <li key={h.id}>
                  {h.display_name}{' '}
                  {h.city ? `(${[h.city, h.state].filter(Boolean).join(', ')})` : ''}{' '}
                  <Button
                    variant="text"
                    disabled={busy}
                    onClick={() => run('POST', url, { entityId: h.id })}
                  >
                    {t.link}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/** Admin shortcut (SPEC 11): ban the IP and device this report came from. */
export function BanPanel({
  reportId,
  ipKnown,
  deviceKnown,
  isAdmin,
}: {
  reportId: string;
  ipKnown: boolean;
  deviceKnown: boolean;
  isAdmin: boolean;
}) {
  const { run, busy, error } = useAdminAction();
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<string>('30');
  const [result, setResult] = useState<{ ip: boolean; device: boolean } | null>(null);
  return (
    <div className="stack">
      <p>{t.sourceKnown(ipKnown, deviceKnown)}</p>
      {!isAdmin ? (
        <p className="muted">{t.adminOnly}</p>
      ) : (
        <>
          {error && <StatusMessage tone="error" title={error} />}
          {result && <StatusMessage tone="success" title={t.banned(result.ip, result.device)} />}
          <TextField
            name="banReason"
            label={t.banReason}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
          />
          <SelectField
            name="banDuration"
            label={t.banDuration}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            options={BAN_DAYS.map((d) => ({ value: d, label: t.banDurations[d] ?? d }))}
          />
          <div>
            <Button
              variant="danger"
              disabled={busy || !reason.trim() || (!ipKnown && !deviceKnown)}
              onClick={async () => {
                const r = await run<{ ip: boolean; device: boolean }>(
                  'POST',
                  `/api/admin/reports/${reportId}/ban`,
                  { reason, duration },
                );
                if (r) setResult(r);
              }}
            >
              {t.ban}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
