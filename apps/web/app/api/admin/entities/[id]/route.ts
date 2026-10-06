import { EntityAction, fieldErrors } from '@rmmm/api';
import { adminRoute, pgError } from '@/lib/admin/api';
import { apiError, json, readJson } from '@/lib/api';
import { normalizeIdentifier } from '@/lib/server/identifiers';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/entities/:id: edit, approve, publish, legal hold, merge, link,
 * identifiers. Postgres enforces the two-person rule and legal hold; we pass its answer on.
 */
export const PATCH = adminRoute<Ctx>('entities.update', async (req, staff, { params }) => {
  const { id } = await params;
  const parsed = EntityAction.safeParse(await readJson(req));
  if (!parsed.success)
    return apiError(422, 'invalid', 'Check the form.', fieldErrors(parsed.error));
  const a = parsed.data;
  const { sb, role } = staff;
  const moderatorish = role === 'moderator' || role === 'admin';
  const deny = () => apiError(403, 'forbidden', 'You do not have permission for that.');

  switch (a.action) {
    case 'update': {
      const f = a.fields;
      const { error } = await sb
        .from('entities')
        .update({
          display_name: f.displayName,
          category: f.category ?? null,
          city: f.city || null,
          state: f.state || null,
        })
        .eq('id', id);
      return pgError(error) ?? json({ ok: true });
    }
    case 'approve':
    case 'withdraw': {
      const { data, error } = await sb.rpc(
        a.action === 'approve' ? 'approve_entity' : 'withdraw_entity_approval',
        { entity: id },
      );
      return pgError(error) ?? json({ approvals: data as number });
    }
    case 'publish':
    case 'unpublish': {
      const { data, error } = await sb
        .from('entities')
        .update({ is_public: a.action === 'publish' })
        .eq('id', id)
        .select('id, is_public');
      if (error?.code === '23514') {
        return apiError(
          422,
          'invalid',
          'Not yet: going public needs approval from a moderator and an editor, two different people.',
          {
            approvals: 'two_person_rule',
          },
        );
      }
      return (
        pgError(error) ??
        (data?.length
          ? json({ isPublic: data[0]!.is_public })
          : apiError(404, 'not_found', 'Not found.'))
      );
    }
    case 'legal_hold': {
      if (role !== 'admin') return deny();
      const { error } = await sb.from('entities').update({ legal_hold: a.on }).eq('id', id);
      return pgError(error) ?? json({ ok: true });
    }
    case 'merge': {
      if (!moderatorish) return deny();
      const { error } = await sb.rpc('merge_entities', { keep: id, drop_id: a.dropId });
      return pgError(error) ?? json({ ok: true });
    }
    case 'link': {
      if (!moderatorish) return deny();
      if (a.otherId === id) return apiError(422, 'invalid', 'Pick a different entity.');
      const [x, y] = [id, a.otherId].sort();
      const { error } = await sb.from('entity_links').upsert(
        {
          a: x,
          b: y,
          reason: 'staff_manual',
          confidence: 1,
          created_by: staff.userId,
          confirmed_by: staff.userId,
          confirmed_at: new Date().toISOString(),
        },
        { ignoreDuplicates: true },
      );
      return pgError(error) ?? json({ ok: true });
    }
    case 'confirm_link': {
      if (!moderatorish) return deny();
      const { error } = await sb
        .from('entity_links')
        .update({ confirmed_by: staff.userId, confirmed_at: new Date().toISOString() })
        .eq('a', a.a)
        .eq('b', a.b)
        .eq('reason', a.reason);
      return pgError(error) ?? json({ ok: true });
    }
    case 'add_identifier': {
      if (!moderatorish) return deny();
      const n = normalizeIdentifier(a.type, a.value);
      if (!n)
        return apiError(422, 'invalid', 'That value does not look right for this type.', {
          value: 'invalid',
        });
      const { error } = await sb
        .from('entity_identifiers')
        .insert({ entity_id: id, type: a.type, raw: a.value, ...n });
      return pgError(error) ?? json({ ok: true }, 201);
    }
    case 'remove_identifier': {
      if (!moderatorish) return deny();
      const { error } = await sb
        .from('entity_identifiers')
        .delete()
        .eq('id', a.identifierId)
        .eq('entity_id', id);
      return pgError(error) ?? json({ ok: true });
    }
  }
});
