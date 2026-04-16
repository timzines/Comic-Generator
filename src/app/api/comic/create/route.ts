import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface Body {
  title: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = (await request.json()) as Body;

    const { data, error } = await supabaseAdmin
      .from('comics')
      .insert({
        user_id: user.id,
        title: body.title || 'Untitled',
        description: body.description,
        genre: null,
        style: 'Manga',
        custom_style: null,
        status: 'drafting',
      })
      .select('id')
      .single();

    if (error || !data) return NextResponse.json({ error: error?.message ?? 'insert_failed' }, { status: 500 });
    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('[comic/create]', err);
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}
