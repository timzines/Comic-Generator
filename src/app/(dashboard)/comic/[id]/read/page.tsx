import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Comic, Panel } from '@/types/database';
import { ReaderClient } from './ReaderClient';

export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: comic } = await supabase.from('comics').select('*').eq('id', id).single();
  if (!comic) notFound();
  const { data: panels } = await supabase.from('panels').select('*').eq('comic_id', id).order('panel_index');
  return <ReaderClient comic={comic as Comic} panels={(panels as Panel[]) ?? []} />;
}
