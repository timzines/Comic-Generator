import { NextResponse, type NextRequest } from 'next/server';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { generatePanelPrompts } from '@/lib/story/orchestrator';
import type { GeneratePanelsRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { comicId, archetype } = (await request.json()) as GeneratePanelsRequest;
    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const panels = await generatePanelPrompts({ comicId, archetype });
    return NextResponse.json({ panels });
  } catch (err) {
    console.error('[panels]', err);
    return NextResponse.json(
      { error: 'panels_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}
