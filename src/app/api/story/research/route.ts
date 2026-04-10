import { NextResponse, type NextRequest } from 'next/server';
import { grok, GROK_MODEL, stripJsonFences } from '@/lib/grok';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import type { ResearchRequest, ResearchResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await request.json()) as ResearchRequest;
    const { comicId, description, genre, style } = body;

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const completion = await grok.chat.completions.create({
      model: GROK_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a creative director for a comic book studio. You research visual and narrative inspiration for comics. Always respond with valid JSON only, no markdown.',
        },
        {
          role: 'user',
          content: `Search the internet for inspiration for a ${genre} comic in ${style} art style. The concept is: ${description}. Return a JSON object with two fields: "inspirations" (array of 5 strings, each a specific reference work or real-world source with brief explanation) and "themes" (array of 3 thematic angles to explore).`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(stripJsonFences(raw)) as ResearchResponse;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[research]', err);
    const message = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: 'research_failed', detail: message }, { status: 500 });
  }
}
