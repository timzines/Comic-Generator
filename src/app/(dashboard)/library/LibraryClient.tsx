'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Comic, ComicStatus } from '@/types/database';
import { ComicCard } from '@/components/comic/ComicCard';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

type Filter = 'all' | ComicStatus;
type Sort = 'newest' | 'oldest' | 'az';

interface Props { initialComics: Comic[] }

export function LibraryClient({ initialComics }: Props) {
  const supabase = createClient();
  const [comics, setComics] = useState(initialComics);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [toDelete, setToDelete] = useState<Comic | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const filtered = useMemo(() => {
    let list = [...comics];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.genre?.toLowerCase().includes(q));
    }
    if (filter !== 'all') list = list.filter((c) => c.status === filter);
    if (sort === 'newest') list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'oldest') list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [comics, query, filter, sort]);

  async function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setComics((prev) => prev.filter((c) => c.id !== id));
    setToDelete(null);
    const { error } = await supabase.from('comics').delete().eq('id', id);
    setToast({ msg: error ? 'Delete failed' : 'Comic deleted', type: error ? 'error' : 'success' });
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold">Saved Comics</h1>
          <p className="text-white/50 mt-1">{comics.length} comics in your library</p>
        </div>
        <Link href="/new" className="bg-accent text-bg font-bold px-5 py-2.5 rounded-lg hover:brightness-110 transition">
          + New Comic
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or genre…"
          className="flex-1 min-w-[200px] bg-surface border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition"
        />
        <div className="flex gap-1 bg-surface border border-white/10 rounded-lg p-1">
          {(['all', 'done', 'generating', 'drafting'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs capitalize transition ${
                filter === f ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="az">A–Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-white/10 rounded-xl p-16 text-center text-white/50">
          No comics match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <ComicCard
              key={c.id}
              comic={c}
              onDelete={setToDelete}
              onExport={() => setToast({ msg: 'Export coming soon', type: 'success' })}
            />
          ))}
        </div>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete comic?">
        <p className="text-white/60 mb-6">
          &quot;{toDelete?.title}&quot; will be permanently deleted along with its panels and references.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setToDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
