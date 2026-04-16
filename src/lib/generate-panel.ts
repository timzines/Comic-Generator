import { fal, FAL_GENERATE_MODEL, GENERATE_PARAMS } from '@/lib/fal';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface GenerateResult {
  imageUrl: string;
  storagePath: string;
}

/**
 * Shared panel generation logic used by both the single and batch routes.
 * Assumes comic ownership has already been verified.
 */
export async function generatePanelInternal(panelId: string, comicId: string, userId: string): Promise<GenerateResult> {
  const { data: panel, error: panelErr } = await supabaseAdmin
    .from('panels')
    .select('id, prompt, image_url, status, panel_index')
    .eq('id', panelId)
    .single();
  if (panelErr || !panel) throw new Error('panel_not_found');

  if (panel.status === 'done' && panel.image_url) {
    return { imageUrl: panel.image_url, storagePath: '' };
  }

  const { data: comic } = await supabaseAdmin
    .from('comics')
    .select('character_bible, style')
    .eq('id', comicId)
    .single();
  if (!comic) throw new Error('comic_not_found');

  const { data: refs } = await supabaseAdmin
    .from('reference_images')
    .select('public_url')
    .eq('comic_id', comicId);

  await supabaseAdmin.from('panels').update({ status: 'generating' }).eq('id', panelId);

  try {
    const artStyle = comic.style || 'Manga';
    const fullPrompt = `${panel.prompt}. Art style: ${artStyle} comic book art, ink-heavy, screentones, dynamic compositions. ${comic.character_bible ?? ''}`;
    const firstRef = refs?.[0]?.public_url;

    const result = await fal.subscribe(FAL_GENERATE_MODEL, {
      input: {
        prompt: fullPrompt,
        ...GENERATE_PARAMS,
        ...(firstRef ? { ip_adapter_image_url: firstRef } : {}),
      },
    });

    // @ts-expect-error — runtime shape from fal
    const rawUrl: string | undefined = result?.data?.images?.[0]?.url ?? result?.images?.[0]?.url;
    if (!rawUrl) throw new Error('no_image_url');

    const imgRes = await fetch(rawUrl);
    const buffer = new Uint8Array(await imgRes.arrayBuffer());

    const storagePath = `${userId}/${comicId}/${panelId}.jpg`;
    const { error: upErr } = await supabaseAdmin.storage
      .from('comic-panels')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
    if (upErr) throw upErr;

    const { data: pub } = supabaseAdmin.storage.from('comic-panels').getPublicUrl(storagePath);
    const publicUrl = pub.publicUrl;

    await supabaseAdmin
      .from('panels')
      .update({ image_url: publicUrl, storage_path: storagePath, status: 'done' })
      .eq('id', panelId);

    return { imageUrl: publicUrl, storagePath };
  } catch (err) {
    await supabaseAdmin.from('panels').update({ status: 'error' }).eq('id', panelId);
    throw err;
  }
}
