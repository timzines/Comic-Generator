import { NextResponse, type NextRequest } from 'next/server';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateStoryOptions } from '@/lib/story/orchestrator';
import type { StoryOptionsRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await request.json()) as StoryOptionsRequest;
    const { comicId, description, research, archetype } = body;

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { data: comic } = await supabaseAdmin.from('comics').select('title').eq('id', comicId).single();

    const options = await generateStoryOptions({
      comicId,
      title: comic?.title ?? 'Untitled',
      description,
      research,
      archetype,
    });
    return NextResponse.json({ options });
  } catch (err) {
    console.error('[options]', err);
    return NextResponse.json(
      { error: 'options_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}
