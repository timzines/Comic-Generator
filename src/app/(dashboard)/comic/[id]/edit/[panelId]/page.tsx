import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Comic, Panel, ReferenceImage } from '@/types/database';
import { EditStudioClient } from './EditStudioClient';

export default async function EditPage({ params }: { params: Promise<{ id: string; panelId: string }> }) {
  const { id, panelId } = await params;
  const supabase = await createClient();
  const { data: panel } = await supabase.from('panels').select('*').eq('id', panelId).single();
  const { data: comic } = await supabase.from('comics').select('*').eq('id', id).single();
  if (!panel || !comic) notFound();
  const { data: refs } = await supabase.from('reference_images').select('*').eq('comic_id', id);

  return (
    <EditStudioClient
      panel={panel as Panel}
      comic={comic as Comic}
      references={(refs as ReferenceImage[]) ?? []}
    />
  );
}
