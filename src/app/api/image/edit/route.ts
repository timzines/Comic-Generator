export const runtime = 'edge';
import { NextResponse, type NextRequest } from 'next/server';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fal, FAL_EDIT_MODEL } from '@/lib/fal';
import type { EditImageRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await request.json()) as EditImageRequest;
    const { panelId, comicId, editPrompt, maskImage, referenceImageUrl } = body;

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { data: panel } = await supabaseAdmin
      .from('panels')
      .select('id, image_url')
      .eq('id', panelId)
      .single();
    if (!panel?.image_url) return NextResponse.json({ error: 'panel_has_no_image' }, { status: 400 });

    const input: Record<string, unknown> = {
      prompt: editPrompt,
      image_url: panel.image_url,
      num_inference_steps: 28,
      guidance_scale: 3.5,
    };
    if (maskImage) input.mask_url = maskImage;
    if (referenceImageUrl) input.reference_image_url = referenceImageUrl;

    const result = await fal.subscribe(FAL_EDIT_MODEL, { input: input as never });

    // @ts-expect-error — fal runtime shape
    const rawUrl: string | undefined = result?.data?.images?.[0]?.url ?? result?.images?.[0]?.url;
    if (!rawUrl) return NextResponse.json({ error: 'no_image_url' }, { status: 500 });

    const imgRes = await fetch(rawUrl);
    const buffer = new Uint8Array(await imgRes.arrayBuffer());
    const storagePath = `${user.id}/${comicId}/${panelId}_edit_${Date.now()}.jpg`;

    await supabaseAdmin.storage
      .from('comic-panels')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

    const { data: pub } = supabaseAdmin.storage.from('comic-panels').getPublicUrl(storagePath);
    const publicUrl = pub.publicUrl;

    await supabaseAdmin
      .from('panels')
      .update({ image_url: publicUrl, storage_path: storagePath })
      .eq('id', panelId);

    return NextResponse.json({ imageUrl: publicUrl });
  } catch (err) {
    console.error('[edit]', err);
    return NextResponse.json({ error: 'edit_failed' }, { status: 500 });
  }
}
