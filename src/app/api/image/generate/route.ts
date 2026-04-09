import { NextResponse, type NextRequest } from 'next/server';
import { requireUser, verifyComicOwnership } from '@/lib/auth';
import { generatePanelInternal } from '@/lib/generate-panel';
import type { GenerateImageRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { panelId, comicId } = (await request.json()) as GenerateImageRequest;
    if (!(await verifyComicOwnership(comicId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { imageUrl } = await generatePanelInternal(panelId, comicId, user.id);
    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error('[generate]', err);
    return NextResponse.json({ error: 'generate_failed' }, { status: 500 });
  }
}
