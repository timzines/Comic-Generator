import { NextResponse, type NextRequest } from 'next/server';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const comicId = new URL(request.url).searchParams.get('comicId');
    if (!comicId) return NextResponse.json({ error: 'missing_comic_id' }, { status: 400 });

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { data: comic } = await supabaseAdmin
      .from('comics')
      .select('title, page_count')
      .eq('id', comicId)
      .single();

    const { data: panels } = await supabaseAdmin
      .from('panels')
      .select('id, panel_index, page_number, position_in_page, prompt, dialog, image_url, status')
      .eq('comic_id', comicId)
      .eq('status', 'done')
      .order('page_number')
      .order('position_in_page');

    return NextResponse.json({
      comic: { title: comic?.title ?? 'Untitled', pageCount: comic?.page_count ?? 0 },
      panels: panels ?? [],
    });
  } catch (err) {
    console.error('[export]', err);
    return NextResponse.json({ error: 'export_failed' }, { status: 500 });
  }
}
