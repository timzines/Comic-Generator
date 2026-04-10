import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Comic, Panel, ReferenceImage } from '@/types/database';
import { StoryboardClient } from './StoryboardClient';

export default async function StoryboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: comic } = await supabase.from('comics').select('*').eq('id', id).single();
  if (!comic) notFound();

  const { data: panels } = await supabase.from('panels').select('*').eq('comic_id', id).order('panel_index');
  const { data: refs } = await supabase.from('reference_images').select('*').eq('comic_id', id);

  return (
    <StoryboardClient
      comic={comic as Comic}
      initialPanels={(panels as Panel[]) ?? []}
      references={(refs as ReferenceImage[]) ?? []}
    />
  );
}
