import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { scoreStoryOption } from '@/lib/story/orchestrator';
import type { ScoreRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { option, archetype } = (await request.json()) as ScoreRequest;
    if (!option) return NextResponse.json({ error: 'missing_option' }, { status: 400 });

    const result = await scoreStoryOption({ option, archetype });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[score]', err);
    return NextResponse.json(
      { error: 'score_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}
