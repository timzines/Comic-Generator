import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function verifyComicOwnership(comicId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('comics')
    .select('id, user_id')
    .eq('id', comicId)
    .single();
  if (error || !data) return false;
  return data.user_id === userId;
}
