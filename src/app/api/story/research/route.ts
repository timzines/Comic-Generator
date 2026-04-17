import { NextResponse, type NextRequest } from 'next/server';
import { grokChat, stripJsonFences } from '@/lib/grok';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import type { ResearchRequest, ResearchResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await request.json()) as ResearchRequest;
    const { comicId, description } = body;

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const result = await grokChat([
      {
        role: 'system',
        content:
          'You are a creative director for a manga studio. You research visual and narrative inspiration for manga comics. Always respond with valid JSON only, no markdown.',
      },
      {
        role: 'user',
        content: `Search the internet for inspiration for a manga comic. The concept is: ${description}. Return a JSON object with two fields: "inspirations" (array of 5 strings, each a specific reference work or real-world source with brief explanation) and "themes" (array of 3 thematic angles to explore).`,
      },
    ]);

    const parsed = JSON.parse(stripJsonFences(result.content)) as ResearchResponse;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[research]', err);
    const message = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: 'research_failed', detail: message }, { status: 500 });
  }
}
