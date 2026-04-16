import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { grok, GROK_MODEL, stripJsonFences } from '@/lib/grok';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { GeneratePanelsRequest } from '@/types/api';
import type { ActBreakdown, PageStructure } from '@/types/database';

const PanelSchema = z.object({
  panelIndex: z.number().int().min(0),
  pageNumber: z.number().int().min(1),
  positionInPage: z.number().int().min(0),
  prompt: z.string(),
  dialog: z.string().nullable(),
});
const PanelsSchema = z.array(PanelSchema).min(1).max(50);

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { comicId } = (await request.json()) as GeneratePanelsRequest;

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { data: comic } = await supabaseAdmin
      .from('comics')
      .select('character_bible, style')
      .eq('id', comicId)
      .single();

    const { data: option } = await supabaseAdmin
      .from('story_options')
      .select('*')
      .eq('comic_id', comicId)
      .eq('selected', true)
      .single();

    if (!comic || !option) return NextResponse.json({ error: 'missing_context' }, { status: 400 });

    const acts = (option.act_breakdown as ActBreakdown[] | null) ?? [];
    const actText = acts.map((a) => `${a.act}: ${a.desc}`).join('\n');

    const pageStructure = (option.page_structure as PageStructure[] | null) ?? [];
    const pageStructureText = pageStructure
      .map(
        (page) =>
          `Page ${page.pageNumber} (${page.panelCount} panels):\n${page.panels
            .map(
              (panel) =>
                `  Panel ${panel.position}: ${panel.description}${panel.dialog ? ` — Dialog: "${panel.dialog}"` : ''}`,
            )
            .join('\n')}`,
      )
      .join('\n\n');

    const totalPanels = pageStructure.reduce((sum, page) => sum + page.panels.length, 0);

    const completion = await grok.chat.completions.create({
      model: GROK_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a manga panel director. You write precise image generation prompts for each panel, respecting the page layout. Respond ONLY with a valid JSON array.',
        },
        {
          role: 'user',
          content: `Write individual image generation prompts for every panel of this manga comic.

Story: ${option.logline}
Character bible: ${comic.character_bible}
Art style: Manga (ink-heavy, screentones, dynamic compositions)

Act breakdown:
${actText}

Page structure:
${pageStructureText}

Generate exactly ${totalPanels || option.estimated_panels} panel prompts, one for each panel in the page structure above.

Return a JSON array of objects, each with:
- panelIndex: number (0-based, sequential across all pages)
- pageNumber: number (1-based, which page this panel belongs to)
- positionInPage: number (0-based, position within the page)
- prompt: string (detailed image generation prompt that includes: the exact scene action, camera angle, lighting, the character's appearance matching the character bible exactly, manga art style descriptor, mood)
- dialog: string or null (character speech/thought bubble text from the page structure, null if no dialog)

IMPORTANT: Every single prompt must include the character's physical description from the character bible verbatim. This ensures consistency across all panels.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '[]';
    const parsed = PanelsSchema.parse(JSON.parse(stripJsonFences(raw)));

    await supabaseAdmin.from('panels').delete().eq('comic_id', comicId);
    const rows = parsed.map((p) => ({
      comic_id: comicId,
      panel_index: p.panelIndex,
      page_number: p.pageNumber,
      position_in_page: p.positionInPage,
      prompt: p.prompt,
      dialog: p.dialog,
      status: 'pending' as const,
    }));
    const { data: inserted } = await supabaseAdmin
      .from('panels')
      .insert(rows)
      .select('id, panel_index, page_number, position_in_page, prompt, dialog');

    const pageCount = pageStructure.length || (option.estimated_pages as number | null) || 1;
    await supabaseAdmin
      .from('comics')
      .update({ panel_count: parsed.length, page_count: pageCount })
      .eq('id', comicId);

    return NextResponse.json({
      panels: (inserted ?? []).map((p) => ({
        id: p.id,
        panelIndex: p.panel_index,
        pageNumber: p.page_number,
        positionInPage: p.position_in_page,
        prompt: p.prompt ?? '',
        dialog: p.dialog ?? null,
      })),
    });
  } catch (err) {
    console.error('[panels]', err);
    return NextResponse.json({ error: 'panels_failed' }, { status: 500 });
  }
}
