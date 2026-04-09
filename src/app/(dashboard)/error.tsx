'use client';
import Link from 'next/link';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-extrabold mb-2">Something went wrong</h1>
      <p className="text-white/50 mb-6">Try again or head back to the dashboard.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="bg-accent text-bg font-bold px-4 py-2 rounded-lg">Retry</button>
        <Link href="/dashboard" className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg">Dashboard</Link>
      </div>
    </div>
  );
}
