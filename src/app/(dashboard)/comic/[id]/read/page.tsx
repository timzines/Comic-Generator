export const runtime = 'edge';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Comic, Panel } from '@/types/database';
import { ReaderClient } from './ReaderClient';

export default async function ReadPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: comic } = await supabase.from('comics').select('*').eq('id', params.id).single();
  if (!comic) notFound();
  const { data: panels } = await supabase.from('panels').select('*').eq('comic_id', params.id).order('panel_index');
  return <ReaderClient comic={comic as Comic} panels={(panels as Panel[]) ?? []} />;
}
