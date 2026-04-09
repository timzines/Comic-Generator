'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Comic, Panel } from '@/types/database';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';
import { Toast } from '@/components/ui/Toast';

interface Props { comic: Comic; panels: Panel[] }

export function ReaderClient({ comic, panels }: Props) {
  const [flush, setFlush] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const next = Math.min(active + 1, panels.length - 1);
        refs.current[next]?.scrollIntoView({ behavior: 'smooth' });
        setActive(next);
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const prev = Math.max(active - 1, 0);
        refs.current[prev]?.scrollIntoView({ behavior: 'smooth' });
        setActive(prev);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, panels.length]);

  async function share() {
    await navigator.clipboard.writeText(window.location.href);
    setToast('Link copied!');
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href={`/comic/${comic.id}/storyboard`} className="text-white/50 text-sm hover:text-white">← Back to Storyboard</Link>
        <h1 className="font-bold">{comic.title}</h1>
        <div className="flex gap-2">
          <button onClick={() => setFlush(!flush)} className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-md">
            {flush ? 'Gap' : 'Flush'}
          </button>
          <button
            onClick={() => setToast('Export coming soon')}
            className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-md"
          >
            Export ZIP
          </button>
        </div>
      </div>

      <div className={`max-w-[760px] mx-auto ${flush ? '' : 'space-y-1'}`}>
        {panels.map((p, i) => (
          <div key={p.id} ref={(el) => { refs.current[i] = el; }} className="relative">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt={`Panel ${p.panel_index}`} className="w-full block" />
            ) : (
              <PlaceholderImage aspectRatio="16/9" index={p.panel_index} />
            )}
            <div className="absolute bottom-2 left-2 font-mono text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
              #{String(p.panel_index).padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-[760px] mx-auto py-16 text-center font-mono text-white/40">— End —</div>
      <div className="max-w-[760px] mx-auto pb-16 flex gap-3 justify-center">
        <button onClick={share} className="text-xs px-4 py-2 bg-white/5 border border-white/10 rounded-md">Share link</button>
        <Link href={`/comic/${comic.id}/storyboard`} className="text-xs px-4 py-2 bg-white/5 border border-white/10 rounded-md">Edit panels</Link>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
