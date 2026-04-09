import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// AUTH BYPASS: fixed guest user so everything works without sign-in.
export const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;
  return { id: GUEST_USER_ID, email: 'guest@local' } as { id: string; email: string };
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
