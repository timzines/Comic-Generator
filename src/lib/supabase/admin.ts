import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  return _client;
}

// Proxy so existing `supabaseAdmin.from(...)` calls still work, but construction is deferred.
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = getAdmin() as unknown as Record<string | symbol, unknown>;
    const v = client[prop];
    return typeof v === 'function' ? v.bind(client) : v;
  },
}) as SupabaseClient;
