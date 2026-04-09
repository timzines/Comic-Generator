import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/Nav';
import { UserProvider } from '@/contexts/UserContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // AUTH BYPASS: fall back to a guest user if no session
  const current = user
    ? { id: user.id, email: user.email ?? '' }
    : { id: '00000000-0000-0000-0000-000000000000', email: 'guest@local' };

  return (
    <UserProvider user={current}>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
      </div>
    </UserProvider>
  );
}
