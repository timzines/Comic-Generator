import { NextResponse, type NextRequest } from 'next/server';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { comicId } = (await request.json()) as { comicId: string };
    if (!comicId) return NextResponse.json({ error: 'missing_comic_id' }, { status: 400 });
    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('comics').delete().eq('id', comicId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ comicId, deleted: true });
  } catch (err) {
    console.error('[reject]', err);
    return NextResponse.json({ error: 'reject_failed' }, { status: 500 });
  }
}
