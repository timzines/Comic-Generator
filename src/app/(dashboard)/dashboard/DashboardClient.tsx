'use client';
import Link from 'next/link';
import type { Comic } from '@/types/database';
import { ComicCard } from '@/components/comic/ComicCard';

interface Props { comics: Comic[] }

export function DashboardClient({ comics }: Props) {
  const total = comics.length;
  const done = comics.filter((c) => c.status === 'done').length;
  const inProgress = comics.filter((c) => c.status === 'generating').length;
  const panels = comics.reduce((sum, c) => sum + (c.panel_count ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <section className="mb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
          Your studio.
          <br />
          <span className="text-accent">Build something wild.</span>
        </h1>
        <p className="text-white/50 mt-4 max-w-xl">
          Describe a concept. Grok researches the web, writes your story, and Flux paints every panel.
        </p>
        <Link
          href="/new"
          className="inline-block mt-6 bg-accent text-bg font-bold px-6 py-3 rounded-lg hover:brightness-110 transition"
        >
          + New Comic
        </Link>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Total Comics', value: total },
          { label: 'Panels Generated', value: panels },
          { label: 'In Progress', value: inProgress },
          { label: 'Completed', value: done },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-white/10 rounded-xl p-5">
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="text-xs text-white/50 mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold">Recent Comics</h2>
          <Link href="/library" className="text-sm text-white/60 hover:text-white">View all →</Link>
        </div>
        {comics.length === 0 ? (
          <Link
            href="/new"
            className="block border-2 border-dashed border-white/10 hover:border-accent rounded-xl p-16 text-center text-white/50 transition"
          >
            <div className="text-5xl mb-3">+</div>
            <div className="font-semibold">Create your first comic</div>
          </Link>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {comics.map((c) => (
              <ComicCard key={c.id} comic={c} />
            ))}
            <Link
              href="/new"
              className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-accent rounded-xl min-h-[280px] text-white/50 hover:text-accent transition"
            >
              <div className="text-4xl mb-2">+</div>
              <div className="font-semibold">Start a new comic</div>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
