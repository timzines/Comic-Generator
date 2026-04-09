import { NextResponse, type NextRequest } from 'next/server';
import { grok, GROK_MODEL } from '@/lib/grok';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { SelectOptionRequest } from '@/types/api';
import type { ActBreakdown } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { comicId, optionIndex } = (await request.json()) as SelectOptionRequest;

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { data: option } = await supabaseAdmin
      .from('story_options')
      .select('*')
      .eq('comic_id', comicId)
      .eq('option_index', optionIndex)
      .single();

    if (!option) return NextResponse.json({ error: 'option_not_found' }, { status: 404 });

    const acts = (option.act_breakdown as ActBreakdown[] | null) ?? [];
    const actSummary = acts.map((a) => `${a.act}: ${a.desc}`).join(' | ');

    const completion = await grok.chat.completions.create({
      model: GROK_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a comic book character designer. Respond only with a single paragraph of plain text.',
        },
        {
          role: 'user',
          content: `Based on this story: "${option.logline}" with these acts: ${actSummary}, write a CHARACTER BIBLE — a single dense paragraph that precisely describes the visual appearance of every named character. Include: hair color and style, eye color, clothing, distinguishing features, body type. Be extremely specific so an AI image generator can maintain consistency across 10+ panels. Focus only on visual appearance, not personality.`,
        },
      ],
    });

    const characterBible = completion.choices[0]?.message?.content?.trim() ?? '';

    await supabaseAdmin
      .from('comics')
      .update({ character_bible: characterBible, status: 'generating' })
      .eq('id', comicId);

    await supabaseAdmin.from('story_options').update({ selected: false }).eq('comic_id', comicId);
    await supabaseAdmin.from('story_options').update({ selected: true }).eq('id', option.id);

    return NextResponse.json({ characterBible });
  } catch (err) {
    console.error('[select]', err);
    return NextResponse.json({ error: 'select_failed' }, { status: 500 });
  }
}
