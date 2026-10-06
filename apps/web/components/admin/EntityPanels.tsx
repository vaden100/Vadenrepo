'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CATEGORIES, IDENT_TYPES } from '@rmmm/api';
import { Button, en, SelectField, StatusMessage, TextField } from '@rmmm/ui/web';
import { requestJson } from '@/components/forms/submit';
import { useAdminAction } from './useAdminAction';

const t = en.admin.entity;
const categoryOptions = CATEGORIES.map((c) => ({ value: c, label: en.report.category.options[c] }));

export function NewEntityForm() {
  const router = useRouter();
  const { run, busy, error } = useAdminAction();
  const [name, setName] = useState('');
  return (
    <div className="row row--end">
      {error && <StatusMessage tone="error" title={error} />}
      <TextField
        name="displayName"
        label={en.admin.report.entityName}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={120}
      />
      <Button
        disabled={busy || !name.trim()}
        onClick={async () => {
          const r = await run<{ id: string }>('POST', '/api/admin/entities', {
            displayName: name.trim(),
          });
          if (r) router.push(`/admin/entities/${r.id}`);
        }}
      >
        {t.create}
      </Button>
    </div>
  );
}

export interface EntityView {
  id: string;
  name: string;
  category: string | null;
  city: string;
  state: string;
  isPublic: boolean;
  legalHold: boolean;
}

/** Details, approvals, publish, legal hold. The two-person rule is Postgres's; we show its answer. */
export function EntityControls({
  entity,
  approvals,
  myApproval,
  role,
}: {
  entity: EntityView;
  approvals: { name: string; role: string }[];
  myApproval: boolean;
  role: string;
}) {
  const { run, busy, error, done } = useAdminAction();
  const [f, setF] = useState({
    displayName: entity.name,
    category: entity.category ?? '',
    city: entity.city,
    state: entity.state,
  });
  const url = `/api/admin/entities/${entity.id}`;
  const moderatorish = role === 'moderator' || role === 'admin';
  return (
    <div className="stack-lg">
      {error && <StatusMessage tone="error" title={error} />}
      {done && <StatusMessage tone="success" title={done} />}
      {entity.legalHold && <StatusMessage tone="warning" title={t.legalHoldOn} />}

      <section aria-labelledby="approvals" className="stack">
        <h2 id="approvals">{t.approvals}</h2>
        <p className="muted">{t.approvalsHint}</p>
        <p>
          <span className="pill" data-testid="entity-status">
            {entity.isPublic ? t.public : t.awaiting(approvals.length)}
          </span>
        </p>
        {approvals.length > 0 && (
          <ul className="admin-list">
            {approvals.map((a) => (
              <li key={a.name + a.role}>
                {a.name} ({en.admin.roles[a.role] ?? a.role})
              </li>
            ))}
          </ul>
        )}
        <div className="row">
          {!entity.isPublic && !myApproval && (
            <Button
              disabled={busy || entity.legalHold}
              onClick={() => run('PATCH', url, { action: 'approve' })}
            >
              {t.approve}
            </Button>
          )}
          {!entity.isPublic && myApproval && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => run('PATCH', url, { action: 'withdraw' })}
            >
              {t.withdraw}
            </Button>
          )}
          {!entity.isPublic ? (
            <Button
              variant="secondary"
              disabled={busy || entity.legalHold}
              onClick={() => run('PATCH', url, { action: 'publish' })}
            >
              {t.publish}
            </Button>
          ) : (
            <Button
              variant="danger"
              disabled={busy || entity.legalHold}
              onClick={() => run('PATCH', url, { action: 'unpublish' })}
            >
              {t.unpublish}
            </Button>
          )}
          {role === 'admin' && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => run('PATCH', url, { action: 'legal_hold', on: !entity.legalHold })}
            >
              {entity.legalHold ? t.liftHold : t.setHold}
            </Button>
          )}
        </div>
      </section>

      <section aria-labelledby="details" className="stack">
        <h2 id="details">{t.details}</h2>
        <div className="report__grid">
          <TextField
            name="displayName"
            label={en.admin.table.name}
            value={f.displayName}
            onChange={(e) => setF({ ...f, displayName: e.target.value })}
            maxLength={120}
          />
          <SelectField
            name="category"
            label={en.admin.table.category}
            value={f.category}
            onChange={(e) => setF({ ...f, category: e.target.value })}
            placeholder={en.forms.chooseOne}
            options={categoryOptions}
          />
          <TextField
            name="city"
            label={en.report.who.city}
            value={f.city}
            onChange={(e) => setF({ ...f, city: e.target.value })}
            maxLength={80}
          />
          <TextField
            name="state"
            label={en.report.who.state}
            value={f.state}
            onChange={(e) => setF({ ...f, state: e.target.value })}
            maxLength={40}
          />
        </div>
        <div>
          <Button
            variant="secondary"
            disabled={busy || (!moderatorish && role !== 'editor')}
            onClick={() =>
              run(
                'PATCH',
                url,
                { action: 'update', fields: { ...f, category: f.category || null } },
                en.admin.report.saved,
              )
            }
          >
            {t.save}
          </Button>
        </div>
      </section>
    </div>
  );
}

export function IdentifierEditor({
  entityId,
  identifiers,
  canEdit,
}: {
  entityId: string;
  identifiers: { id: string; type: string; raw: string }[];
  canEdit: boolean;
}) {
  const { run, busy, error } = useAdminAction();
  const [type, setType] = useState('cashtag');
  const [value, setValue] = useState('');
  const url = `/api/admin/entities/${entityId}`;
  return (
    <div className="stack">
      {error && <StatusMessage tone="error" title={error} />}
      <ul className="admin-list">
        {identifiers.map((i) => (
          <li key={i.id}>
            <span className="pill">{i.type}</span> <span className="mono">{i.raw}</span>
            {canEdit && (
              <Button
                variant="text"
                disabled={busy}
                onClick={() =>
                  run('PATCH', url, { action: 'remove_identifier', identifierId: i.id })
                }
              >
                {t.remove}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <div className="row row--end">
          <SelectField
            name="identType"
            label={t.identifierType}
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={IDENT_TYPES.map((x) => ({ value: x, label: x }))}
          />
          <TextField
            name="identValue"
            label={t.identifierValue}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={300}
          />
          <Button
            variant="secondary"
            disabled={busy || !value.trim()}
            onClick={async () => {
              if (await run('PATCH', url, { action: 'add_identifier', type, value })) setValue('');
            }}
          >
            {t.addIdentifier}
          </Button>
        </div>
      )}
    </div>
  );
}

interface Hit {
  id: string;
  display_name: string;
}

/** Search another entity to link or merge (SPEC 8.4 "merge/link tool"). */
export function LinkMergeTools({ entityId, canEdit }: { entityId: string; canEdit: boolean }) {
  const { run, busy, error } = useAdminAction();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  if (!canEdit) return null;
  const url = `/api/admin/entities/${entityId}`;
  return (
    <div className="stack">
      {error && <StatusMessage tone="error" title={error} />}
      <p className="muted">{t.mergeHint}</p>
      <div className="row row--end">
        <TextField
          name="otherEntity"
          label={en.admin.report.searchEntities}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={80}
        />
        <Button
          variant="secondary"
          onClick={async () => {
            const r = await requestJson<{ entities: Hit[] }>(
              'GET',
              `/api/admin/entities?q=${encodeURIComponent(q)}`,
            );
            if (r.ok) setHits(r.data.entities.filter((h) => h.id !== entityId));
          }}
        >
          {en.admin.bans.search}
        </Button>
      </div>
      {hits.length > 0 && (
        <ul className="admin-list">
          {hits.map((h) => (
            <li key={h.id}>
              {h.display_name}{' '}
              <Button
                variant="text"
                disabled={busy}
                onClick={() => run('PATCH', url, { action: 'link', otherId: h.id })}
              >
                {t.addLink}
              </Button>
              <Button
                variant="text"
                disabled={busy}
                onClick={() => run('PATCH', url, { action: 'merge', dropId: h.id })}
              >
                {t.mergeConfirm(h.display_name)}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ConfirmLinkButton({
  entityId,
  a,
  b,
  reason,
}: {
  entityId: string;
  a: string;
  b: string;
  reason: string;
}) {
  const { run, busy } = useAdminAction();
  return (
    <Button
      variant="text"
      disabled={busy}
      onClick={() =>
        run('PATCH', `/api/admin/entities/${entityId}`, { action: 'confirm_link', a, b, reason })
      }
    >
      {t.confirm}
    </Button>
  );
}
