export const runtime = 'edge';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { grok, GROK_MODEL, stripJsonFences } from '@/lib/grok';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { GeneratePanelsRequest } from '@/types/api';
import type { ActBreakdown } from '@/types/database';

const PanelSchema = z.object({ panelIndex: z.number().int().min(0), prompt: z.string() });
const PanelsSchema = z.array(PanelSchema).min(1).max(30);

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

    const completion = await grok.chat.completions.create({
      model: GROK_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a comic book panel director. You write precise image generation prompts. Respond ONLY with a valid JSON array.',
        },
        {
          role: 'user',
          content: `Write individual image generation prompts for every panel of this comic.

Story: ${option.logline}
Character bible: ${comic.character_bible}
Art style: ${comic.style}

Act breakdown:
${actText}

Generate exactly ${option.estimated_panels} panel prompts. Distribute them across the 3 acts proportionally.

Return a JSON array of objects, each with:
- panelIndex: number (0-based)
- prompt: string (detailed image generation prompt that includes: the exact scene action, camera angle, lighting, the character's appearance matching the character bible exactly, art style descriptor, mood)

IMPORTANT: Every single prompt must include the character's physical description from the character bible verbatim. This ensures consistency.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '[]';
    const parsed = PanelsSchema.parse(JSON.parse(stripJsonFences(raw)));

    await supabaseAdmin.from('panels').delete().eq('comic_id', comicId);
    const rows = parsed.map((p) => ({
      comic_id: comicId,
      panel_index: p.panelIndex,
      prompt: p.prompt,
      status: 'pending' as const,
    }));
    const { data: inserted } = await supabaseAdmin.from('panels').insert(rows).select('id, panel_index, prompt');

    await supabaseAdmin.from('comics').update({ panel_count: parsed.length }).eq('id', comicId);

    return NextResponse.json({
      panels: (inserted ?? []).map((p) => ({ id: p.id, panelIndex: p.panel_index, prompt: p.prompt ?? '' })),
    });
  } catch (err) {
    console.error('[panels]', err);
    return NextResponse.json({ error: 'panels_failed' }, { status: 500 });
  }
}
