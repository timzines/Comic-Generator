'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/UserContext';

const LINKS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/library', label: 'Saved Comics' },
  { href: '/new', label: 'New Comic' },
  { href: '/character-prompt', label: 'Character Prompt' },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-40 h-[60px] border-b border-white/5 bg-bg/80 backdrop-blur">
      <div className="h-full px-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent flex items-center justify-center text-bg font-bold text-sm">⚡</div>
          <span className="font-bold tracking-tight">Comic Studio</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== '/dashboard' && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-2 rounded-md text-sm transition ${
                  active ? 'bg-white/5 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-accent text-bg font-bold flex items-center justify-center"
          >
            {user.email[0]?.toUpperCase()}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-lg shadow-xl py-1">
              <div className="px-3 py-2 text-xs text-white/50 border-b border-white/5">{user.email}</div>
              <button
                onClick={signOut}
                className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
