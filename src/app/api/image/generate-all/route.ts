import { type NextRequest } from 'next/server';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generatePanelInternal } from '@/lib/generate-panel';

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  const comicId = new URL(request.url).searchParams.get('comicId');
  if (!comicId) return new Response('missing_comic_id', { status: 400 });

  if (!(await verifyComicOwnership(comicId, user.id))) {
    return new Response('forbidden', { status: 403 });
  }

  const { data: panels } = await supabaseAdmin
    .from('panels')
    .select('id, panel_index, status')
    .eq('comic_id', comicId)
    .in('status', ['pending', 'error'])
    .order('panel_index');

  const userId = user.id;
  const encoder = new TextEncoder();
  const list = panels ?? [];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      send({ type: 'start', total: list.length });

      let generated = 0;
      let errors = 0;
      for (const p of list) {
        send({ type: 'progress', panelId: p.id, panelIndex: p.panel_index, status: 'generating' });
        try {
          const { imageUrl } = await generatePanelInternal(p.id, comicId, userId);
          send({ type: 'done', panelId: p.id, panelIndex: p.panel_index, imageUrl });
          generated++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'unknown';
          send({ type: 'error', panelId: p.id, panelIndex: p.panel_index, error: msg });
          errors++;
        }
      }

      send({ type: 'complete', generated, errors });
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
