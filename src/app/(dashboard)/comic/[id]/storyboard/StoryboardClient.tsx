'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Comic, Panel, ReferenceImage, PanelStatus } from '@/types/database';
import type { SSEEvent } from '@/types/api';
import { PanelCard } from '@/components/comic/PanelCard';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

interface Props {
  comic: Comic;
  initialPanels: Panel[];
  references: ReferenceImage[];
}

export function StoryboardClient({ comic, initialPanels }: Props) {
  const [panels, setPanels] = useState(initialPanels);
  const [progress, setProgress] = useState({ generated: 0, total: 0 });
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [streamId, setStreamId] = useState(0);

  const doneCount = panels.filter((p) => p.status === 'done').length;

  useEffect(() => {
    if (!running) return;
    const es = new EventSource(`/api/image/generate-all?comicId=${comic.id}`);
    es.onmessage = (ev) => {
      const e = JSON.parse(ev.data) as SSEEvent;
      if (e.type === 'start') setProgress({ generated: 0, total: e.total });
      else if (e.type === 'progress') {
        setPanels((prev) => prev.map((p) => (p.id === e.panelId ? { ...p, status: 'generating' as PanelStatus } : p)));
      } else if (e.type === 'done') {
        setPanels((prev) => prev.map((p) => (p.id === e.panelId ? { ...p, status: 'done' as PanelStatus, image_url: e.imageUrl } : p)));
        setProgress((pg) => ({ ...pg, generated: pg.generated + 1 }));
      } else if (e.type === 'error') {
        setPanels((prev) => prev.map((p) => (p.id === e.panelId ? { ...p, status: 'error' as PanelStatus } : p)));
      } else if (e.type === 'complete') {
        setRunning(false);
        setToast('All panels generated!');
        es.close();
      }
    };
    es.onerror = () => {
      setRunning(false);
      es.close();
    };
    return () => es.close();
  }, [running, comic.id, streamId]);

  function generateAll() {
    setStreamId((n) => n + 1);
    setRunning(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/dashboard" className="text-white/50 text-sm hover:text-white">← Back to Dashboard</Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-extrabold">{comic.title}</h1>
          <div className="flex gap-2 mt-2">
            {comic.genre && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">{comic.genre}</span>}
            {comic.style && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">{comic.style}</span>}
          </div>
          <p className="text-white/50 text-sm mt-2">{doneCount} of {panels.length} panels generated</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/comic/${comic.id}/read`} className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10">Read</Link>
          <Button onClick={generateAll} loading={running}>Generate All</Button>
        </div>
      </div>

      {running && progress.total > 0 && (
        <div className="mb-6 p-4 bg-surface border border-accent/30 rounded-lg">
          <div className="flex justify-between text-xs text-white/60 mb-2">
            <span>Generating panels…</span>
            <span>{progress.generated} / {progress.total}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress.total ? (progress.generated / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {panels.map((p) => (
          <PanelCard key={p.id} panel={p} comicId={comic.id} />
        ))}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
