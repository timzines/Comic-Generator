import { NextResponse, type NextRequest } from 'next/server';
import { grokChat, stripJsonFences } from '@/lib/grok';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { OptionSchema } from '@/lib/schemas/story';
import type { EditStorylineRequest } from '@/types/api';
import type { ActBreakdown, PageStructure } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { comicId, editPrompt } = (await request.json()) as EditStorylineRequest;

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { data: option } = await supabaseAdmin
      .from('story_options')
      .select('*')
      .eq('comic_id', comicId)
      .eq('selected', true)
      .single();

    if (!option) return NextResponse.json({ error: 'no_selected_option' }, { status: 400 });

    const acts = (option.act_breakdown as ActBreakdown[] | null) ?? [];
    const pageStructure = (option.page_structure as PageStructure[] | null) ?? [];

    const currentOption = {
      title: option.title,
      logline: option.logline,
      actBreakdown: acts,
      estimatedPanels: option.estimated_panels,
      estimatedPages: option.estimated_pages,
      pageStructure,
      tone: option.tone,
    };

    const result = await grokChat([
      {
        role: 'system',
        content:
          'You are a master manga writer and page layout director. You revise story structures based on editorial feedback. Respond ONLY with a valid JSON object. No markdown, no explanation, no preamble.',
      },
      {
        role: 'user',
        content: `Here is the current manga story option:

${JSON.stringify(currentOption, null, 2)}

The user wants the following edit applied:
"${editPrompt}"

Apply the edit and return a single updated JSON object with the same structure:
- title: string (compelling story title)
- logline: string (one punchy sentence describing the story)
- actBreakdown: array of exactly 3 objects, each with 'act' and 'desc'
- estimatedPanels: number (total panel count across all pages)
- estimatedPages: number (between 3 and 8)
- pageStructure: array of page objects, one per page. Each page has:
  - pageNumber: number (1-based)
  - panelCount: number (3-5 panels per page)
  - panels: array of panel objects, each with:
    - position: number (0-based index within the page)
    - description: string (vivid manga scene description)
    - dialog: string or null (character speech/thought bubble text)
- tone: string (2-3 words describing the emotional tone)

Keep everything that the edit does not change. The total panels across all pages must equal estimatedPanels.`,
      },
    ]);

    const parsed = OptionSchema.parse(JSON.parse(stripJsonFences(result.content)));

    await supabaseAdmin
      .from('story_options')
      .update({
        title: parsed.title,
        logline: parsed.logline,
        act_breakdown: parsed.actBreakdown,
        estimated_panels: parsed.estimatedPanels,
        estimated_pages: parsed.estimatedPages,
        page_structure: parsed.pageStructure,
        tone: parsed.tone,
      })
      .eq('id', option.id);

    return NextResponse.json({ option: parsed });
  } catch (err) {
    console.error('[story/edit]', err);
    return NextResponse.json({ error: 'edit_failed' }, { status: 500 });
  }
}
