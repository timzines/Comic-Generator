import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const NAME_PATTERN = /^[A-Za-z0-9_]{1,30}$/;

function normalize(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^\/?r\//i, '');
  if (!NAME_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('tracked_subreddits')
    .select('name, active, created_at')
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ subreddits: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json()) as { name?: string };
  const name = normalize(body.name ?? null);
  if (!name) return NextResponse.json({ error: 'invalid_name' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('tracked_subreddits')
    .upsert({ name, active: true }, { onConflict: 'name' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ name });
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const name = normalize(new URL(request.url).searchParams.get('name'));
  if (!name) return NextResponse.json({ error: 'invalid_name' }, { status: 400 });

  const { error } = await supabaseAdmin.from('tracked_subreddits').delete().eq('name', name);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ name });
}
