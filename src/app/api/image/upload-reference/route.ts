import { NextResponse, type NextRequest } from 'next/server';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const comicId = formData.get('comicId') as string | null;

    if (!file || !comicId) return NextResponse.json({ error: 'missing_params' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'not_an_image' }, { status: 400 });

    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const storagePath = `${user.id}/${comicId}/${crypto.randomUUID()}.${ext}`;
    const buffer = new Uint8Array(await file.arrayBuffer());

    const { error: upErr } = await supabaseAdmin.storage
      .from('reference-images')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { data: pub } = supabaseAdmin.storage.from('reference-images').getPublicUrl(storagePath);
    const publicUrl = pub.publicUrl;

    const { data: row } = await supabaseAdmin
      .from('reference_images')
      .insert({ comic_id: comicId, storage_path: storagePath, public_url: publicUrl, label: file.name })
      .select('id, public_url, label')
      .single();

    return NextResponse.json({
      referenceImage: { id: row?.id, publicUrl: row?.public_url, label: row?.label },
    });
  } catch (err) {
    console.error('[upload-reference]', err);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }
}
