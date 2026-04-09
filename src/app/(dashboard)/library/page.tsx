export const runtime = 'edge';
import { createClient } from '@/lib/supabase/server';
import { LibraryClient } from './LibraryClient';
import type { Comic } from '@/types/database';

export default async function LibraryPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('comics')
    .select('*')
    .order('created_at', { ascending: false });

  return <LibraryClient initialComics={(data as Comic[]) ?? []} />;
}
