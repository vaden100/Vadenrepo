import { EntityFields, fieldErrors } from '@rmmm/api';
import { adminRoute, pgError } from '@/lib/admin/api';
import { slugify } from '@/lib/admin/slug';
import { apiError, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** GET /api/admin/entities?q=: search by name (link and merge pickers). */
export const GET = adminRoute('entities.search', async (req, staff) => {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 80);
  let query = staff.sb
    .from('entities')
    .select('id, display_name, slug, city, state, is_public')
    .order('created_at', { ascending: false })
    .limit(20);
  if (q) query = query.ilike('display_name', `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const { data, error } = await query;
  if (pgError(error)) return pgError(error)!;
  return json({ entities: data ?? [] });
});

/** POST /api/admin/entities: create a (non-public) entity. */
export const POST = adminRoute(
  'entities.create',
  async (req, staff) => {
    const parsed = EntityFields.safeParse(await readJson(req));
    if (!parsed.success)
      return apiError(422, 'invalid', 'Check the form.', fieldErrors(parsed.error));
    const f = parsed.data;
    const { data, error } = await staff.sb
      .from('entities')
      .insert({
        slug: slugify(f.displayName),
        display_name: f.displayName,
        category: f.category ?? null,
        city: f.city || null,
        state: f.state || null,
      })
      .select('id')
      .single();
    if (pgError(error)) return pgError(error)!;
    return json({ id: data!.id }, 201);
  },
  ['moderator', 'admin'],
);
