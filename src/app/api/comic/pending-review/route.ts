import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: comics, error } = await supabaseAdmin
    .from('comics')
    .select('id, title, description, archetype, panel_count, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (comics ?? []).map((c) => c.id);
  if (ids.length === 0) return NextResponse.json({ comics: [] });

  const { data: panels } = await supabaseAdmin
    .from('panels')
    .select('id, comic_id, panel_index, image_url, status')
    .in('comic_id', ids)
    .order('panel_index', { ascending: true });

  const panelsByComic = new Map<string, typeof panels>();
  for (const p of panels ?? []) {
    const arr = panelsByComic.get(p.comic_id) ?? [];
    arr.push(p);
    panelsByComic.set(p.comic_id, arr);
  }

  const results = (comics ?? []).map((c) => ({
    ...c,
    panels: panelsByComic.get(c.id) ?? [],
  }));
  return NextResponse.json({ comics: results });
}
