import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Comic, Panel, ReferenceImage } from '@/types/database';
import { StoryboardClient } from './StoryboardClient';

export default async function StoryboardPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: comic } = await supabase.from('comics').select('*').eq('id', params.id).single();
  if (!comic) notFound();

  const { data: panels } = await supabase.from('panels').select('*').eq('comic_id', params.id).order('panel_index');
  const { data: refs } = await supabase.from('reference_images').select('*').eq('comic_id', params.id);

  return (
    <StoryboardClient
      comic={comic as Comic}
      initialPanels={(panels as Panel[]) ?? []}
      references={(refs as ReferenceImage[]) ?? []}
    />
  );
}
