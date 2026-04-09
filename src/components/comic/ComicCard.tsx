'use client';
import Link from 'next/link';
import type { Comic } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';

interface Props {
  comic: Comic;
  onDelete?: (c: Comic) => void;
  onExport?: (c: Comic) => void;
}
export function ComicCard({ comic, onDelete, onExport }: Props) {
  return (
    <div className="group bg-surface border border-white/10 rounded-xl overflow-hidden hover:border-white/30 hover:-translate-y-0.5 transition">
      <Link href={`/comic/${comic.id}/storyboard`} className="block">
        <PlaceholderImage label={comic.title} aspectRatio="16/10" />
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-base leading-tight truncate">{comic.title}</h3>
          <Badge status={comic.status} />
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {comic.genre && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/5">{comic.genre}</span>}
          {comic.style && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/5">{comic.style}</span>}
        </div>
        <div className="text-xs text-white/40 mb-3">
          {comic.panel_count} panels · {new Date(comic.updated_at).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/comic/${comic.id}/storyboard`}
            className="flex-1 text-center text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 rounded-md transition"
          >
            Open
          </Link>
          {onExport && (
            <button onClick={() => onExport(comic)} className="text-xs px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md">
              Export
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(comic)}
              className="text-xs px-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-md"
              aria-label="delete"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
