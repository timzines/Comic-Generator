import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './DashboardClient';
import type { Comic } from '@/types/database';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('comics')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(6);

  return <DashboardClient comics={(data as Comic[]) ?? []} />;
}
