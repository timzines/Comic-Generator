import { NextResponse, type NextRequest } from 'next/server';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { researchForDescription } from '@/lib/story/orchestrator';
import type { ResearchRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { comicId, description } = (await request.json()) as ResearchRequest;
    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const research = await researchForDescription(description);
    return NextResponse.json(research);
  } catch (err) {
    console.error('[research]', err);
    return NextResponse.json(
      { error: 'research_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}
