import { NextResponse, type NextRequest } from 'next/server';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { selectStoryOption } from '@/lib/story/orchestrator';
import type { SelectOptionRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { comicId, optionIndex } = (await request.json()) as SelectOptionRequest;
    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { characterBible } = await selectStoryOption({ comicId, optionIndex });
    return NextResponse.json({ characterBible });
  } catch (err) {
    console.error('[select]', err);
    return NextResponse.json(
      { error: 'select_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}
