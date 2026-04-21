import { type NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  researchForDescription,
  generateStoryOptions,
  scoreStoryOption,
  selectStoryOption,
  generatePanelPrompts,
  pickBestOption,
} from '@/lib/story/orchestrator';
import { generatePanelInternal } from '@/lib/generate-panel';
import type { AutopilotEvent, AutopilotRequest, AutopilotStage } from '@/types/api';

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  const body = (await request.json()) as AutopilotRequest;
  const title = (body.title || '').trim() || 'Untitled';
  const description = (body.description || '').trim();
  const archetype = body.archetype;

  if (!description) return new Response('missing_description', { status: 400 });

  const { data: comicRow, error: createErr } = await supabaseAdmin
    .from('comics')
    .insert({
      user_id: user.id,
      title,
      description,
      style: 'Manga',
      archetype: archetype ?? null,
      status: 'drafting',
    })
    .select('id')
    .single();

  if (createErr || !comicRow) {
    return new Response(`create_failed: ${createErr?.message ?? 'unknown'}`, { status: 500 });
  }

  const comicId = comicRow.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AutopilotEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      async function fail(stage: AutopilotStage, err: unknown) {
        const message = err instanceof Error ? err.message : 'unknown';
        console.error(`[autopilot:${stage}]`, err);
        await supabaseAdmin.from('comics').update({ status: 'error' }).eq('id', comicId);
        send({ type: 'error', stage, message });
        controller.close();
      }

      send({ type: 'start', comicId });

      let research;
      send({ type: 'stage', stage: 'research' });
      try {
        research = await researchForDescription(description);
      } catch (err) {
        return fail('research', err);
      }

      let options;
      send({ type: 'stage', stage: 'options' });
      try {
        options = await generateStoryOptions({ comicId, title, description, research, archetype });
      } catch (err) {
        return fail('options', err);
      }

      send({ type: 'stage', stage: 'score' });
      let scores;
      try {
        scores = await Promise.all(
          options.map((option) => scoreStoryOption({ option, archetype })),
        );
      } catch (err) {
        return fail('score', err);
      }

      scores.forEach((s, i) => send({ type: 'score', optionIndex: i, score: s.score, rationale: s.rationale }));
      const best = pickBestOption(options, scores);
      send({ type: 'selected', optionIndex: best.optionIndex, score: best.score });

      send({ type: 'stage', stage: 'select' });
      try {
        await selectStoryOption({ comicId, optionIndex: best.optionIndex, archetype });
      } catch (err) {
        return fail('select', err);
      }

      let panels;
      send({ type: 'stage', stage: 'panels' });
      try {
        panels = await generatePanelPrompts({ comicId, archetype });
      } catch (err) {
        return fail('panels', err);
      }

      send({ type: 'stage', stage: 'images', detail: `${panels.length} panels` });
      let errorCount = 0;
      for (const p of panels) {
        try {
          const { imageUrl } = await generatePanelInternal(p.id, comicId, user.id);
          send({ type: 'panel', panelIndex: p.panelIndex, imageUrl });
        } catch (err) {
          errorCount++;
          send({
            type: 'panelError',
            panelIndex: p.panelIndex,
            message: err instanceof Error ? err.message : 'unknown',
          });
        }
      }

      const finalStatus = errorCount === panels.length ? 'error' : 'pending_review';
      await supabaseAdmin.from('comics').update({ status: finalStatus }).eq('id', comicId);

      send({ type: 'stage', stage: 'done' });
      send({ type: 'complete', comicId, panelCount: panels.length, errorCount });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
