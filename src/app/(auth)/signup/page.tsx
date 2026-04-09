'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">✉️</div>
        <h1 className="text-3xl font-extrabold mb-2">Check your email</h1>
        <p className="text-white/60">We sent a confirmation link to <span className="text-accent">{email}</span>.</p>
        <Link href="/login" className="inline-block mt-8 text-accent hover:underline">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-bg font-bold">⚡</div>
        <span className="font-bold tracking-tight text-lg">Comic Studio</span>
      </div>
      <h1 className="text-4xl font-extrabold mb-2">Create account</h1>
      <p className="text-white/50 mb-8">Start your first comic in minutes.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition" />
        <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition" />
        <input type="password" required placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-accent text-bg font-bold py-3 rounded-lg hover:brightness-110 disabled:opacity-50 transition flex items-center justify-center gap-2">
          {loading && <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />}
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="text-center text-white/50 mt-6 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-accent hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
