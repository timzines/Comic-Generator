'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-bg font-bold">⚡</div>
        <span className="font-bold tracking-tight text-lg">Comic Studio</span>
      </div>
      <h1 className="text-4xl font-extrabold mb-2">Sign in</h1>
      <p className="text-white/50 mb-8">Welcome back. Let&apos;s build something wild.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-white/60 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition"
          />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-bg font-bold py-3 rounded-lg hover:brightness-110 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          {loading && <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-center text-white/30 mt-6 text-xs">Sign-ups are disabled.</p>
    </div>
  );
}
