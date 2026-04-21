import { NextResponse, type NextRequest } from 'next/server';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fal, FAL_EDIT_MODEL, EDIT_PARAMS } from '@/lib/fal';
import type { EditImageRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await request.json()) as EditImageRequest;
    const { panelId, comicId, editPrompt, referenceImageUrl } = body;

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { data: panel } = await supabaseAdmin
      .from('panels')
      .select('id, image_url')
      .eq('id', panelId)
      .single();
    if (!panel?.image_url) return NextResponse.json({ error: 'panel_has_no_image' }, { status: 400 });

    const imageUrls = [panel.image_url];
    if (referenceImageUrl) imageUrls.push(referenceImageUrl);

    const input = {
      prompt: editPrompt,
      image_urls: imageUrls,
      ...EDIT_PARAMS,
    };

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
