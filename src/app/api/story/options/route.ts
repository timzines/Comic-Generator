import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { grok, GROK_MODEL, stripJsonFences } from '@/lib/grok';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { StoryOptionsRequest } from '@/types/api';

const OptionSchema = z.object({
  title: z.string(),
  logline: z.string(),
  actBreakdown: z.array(z.object({ act: z.string(), desc: z.string() })).length(3),
  estimatedPanels: z.number().int().min(4).max(24),
  tone: z.string(),
});
const OptionsSchema = z.array(OptionSchema).length(3);

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await request.json()) as StoryOptionsRequest;
    const { comicId, description, genre, style, research } = body;

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { data: comic } = await supabaseAdmin.from('comics').select('title').eq('id', comicId).single();

    const completion = await grok.chat.completions.create({
      model: GROK_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a master comic book writer. You write compelling, visually-rich story structures. Respond ONLY with a valid JSON array. No markdown, no explanation, no preamble.',
        },
        {
          role: 'user',
          content: `Write exactly 3 distinct story options for a ${genre} comic titled "${comic?.title ?? 'Untitled'}" in ${style} art style.

Concept: ${description}

Inspiration research: ${JSON.stringify(research.inspirations)}
Themes to explore: ${research.themes.join(', ')}

Return a JSON array of exactly 3 objects, each with:
- title: string (compelling story title)
- logline: string (one punchy sentence describing the story)
- actBreakdown: array of exactly 3 objects, each with 'act' (string: 'Act 1', 'Act 2', 'Act 3') and 'desc' (string: 2 sentence description of what happens)
- estimatedPanels: number (between 8 and 14)
- tone: string (2-3 words describing the emotional tone)`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '[]';
    const parsed = OptionsSchema.parse(JSON.parse(stripJsonFences(raw)));

    await supabaseAdmin.from('story_options').delete().eq('comic_id', comicId);
    const rows = parsed.map((o, i) => ({
      comic_id: comicId,
      option_index: i,
      title: o.title,
      logline: o.logline,
      act_breakdown: o.actBreakdown,
      estimated_panels: o.estimatedPanels,
      tone: o.tone,
      selected: false,
    }));
    await supabaseAdmin.from('story_options').insert(rows);

    return NextResponse.json({ options: parsed });
  } catch (err) {
    console.error('[options]', err);
    return NextResponse.json({ error: 'options_failed' }, { status: 500 });
  }
}
