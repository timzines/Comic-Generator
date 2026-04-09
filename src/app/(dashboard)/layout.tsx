import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/Nav';
import { UserProvider } from '@/contexts/UserContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <UserProvider user={{ id: user.id, email: user.email ?? '' }}>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
      </div>
    </UserProvider>
  );
}
