import { NextResponse, type NextRequest } from 'next/server';
import { grokChat, stripJsonFences } from '@/lib/grok';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { OptionsSchema } from '@/lib/schemas/story';
import type { StoryOptionsRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await request.json()) as StoryOptionsRequest;
    const { comicId, description, research } = body;

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { data: comic } = await supabaseAdmin.from('comics').select('title').eq('id', comicId).single();

    const result = await grokChat([
      {
        role: 'system',
        content:
          'You are a master manga writer and page layout director. You write compelling, visually-rich story structures with detailed page-by-page breakdowns. Respond ONLY with a valid JSON array. No markdown, no explanation, no preamble.',
      },
      {
        role: 'user',
        content: `Write exactly 3 distinct story options for a manga comic titled "${comic?.title ?? 'Untitled'}".

Concept: ${description}

Inspiration research: ${JSON.stringify(research.inspirations)}
Themes to explore: ${research.themes.join(', ')}

Return a JSON array of exactly 3 objects, each with:
- title: string (compelling story title)
- logline: string (one punchy sentence describing the story)
- actBreakdown: array of exactly 3 objects, each with 'act' (string: 'Act 1', 'Act 2', 'Act 3') and 'desc' (string: 2 sentence description of what happens)
- estimatedPanels: number (total panel count across all pages)
- estimatedPages: number (between 3 and 8)
- pageStructure: array of page objects, one per page. Each page has:
  - pageNumber: number (1-based)
  - panelCount: number (3-5 panels per page)
  - panels: array of panel objects, each with:
    - position: number (0-based index within the page)
    - description: string (vivid manga scene description — action, framing, emotion)
    - dialog: string or null (character speech/thought bubble text, null if no dialog)
- tone: string (2-3 words describing the emotional tone)

Think like a manga editor: pace reveals across pages, use splash panels for dramatic moments, and write dialog that sounds natural. The total panels across all pages must equal estimatedPanels.`,
      },
    ]);

    const parsed = OptionsSchema.parse(JSON.parse(stripJsonFences(result.content)));

    await supabaseAdmin.from('story_options').delete().eq('comic_id', comicId);
    const rows = parsed.map((o, i) => ({
      comic_id: comicId,
      option_index: i,
      title: o.title,
      logline: o.logline,
      act_breakdown: o.actBreakdown,
      estimated_panels: o.estimatedPanels,
      estimated_pages: o.estimatedPages,
      page_structure: o.pageStructure,
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
