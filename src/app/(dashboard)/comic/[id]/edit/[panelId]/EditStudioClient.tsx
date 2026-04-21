'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Comic, Panel, ReferenceImage } from '@/types/database';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

interface Props { panel: Panel; comic: Comic; references: ReferenceImage[] }

interface HistoryItem { prompt: string; time: string }

export function EditStudioClient({ panel: initialPanel, comic, references }: Props) {
  const [panel, setPanel] = useState(initialPanel);
  const [editPrompt, setEditPrompt] = useState('');
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  async function applyEdit() {
    if (!editPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/image/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panelId: panel.id,
          comicId: comic.id,
          editPrompt,
          referenceImageUrl: selectedRef ?? undefined,
        }),
      });
      if (!res.ok) throw new Error('Edit failed');
      const { imageUrl } = (await res.json()) as { imageUrl: string };
      setPanel((p) => ({ ...p, image_url: imageUrl }));
      setHistory((prev) => [{ prompt: editPrompt, time: new Date().toLocaleTimeString() }, ...prev]);
      setEditPrompt('');
      setToast({ msg: 'Edit applied', type: 'success' });
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'error', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    setLoading(true);
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panelId: panel.id, comicId: comic.id }),
      });
      if (!res.ok) throw new Error('Regenerate failed');
      const { imageUrl } = (await res.json()) as { imageUrl: string };
      setPanel((p) => ({ ...p, image_url: imageUrl }));
      setToast({ msg: 'Regenerated', type: 'success' });
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'error', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-4">
        <Link href={`/comic/${comic.id}/storyboard`} className="text-white/50 text-sm hover:text-white">← Back to Storyboard</Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Edit panel #{String(panel.panel_index).padStart(2, '0')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="relative bg-surface border border-white/10 rounded-lg overflow-hidden">
          {panel.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={panel.image_url} alt="panel" className="w-full block" />
          ) : (
            <PlaceholderImage aspectRatio="16/9" />
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs text-white/60 mb-2">Describe your edit</label>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g. Change the background to a stormy night sky with lightning…"
              className="w-full min-h-[120px] bg-surface border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
            />
            <Button onClick={applyEdit} loading={loading} className="mt-2 w-full">
              Apply edit
            </Button>
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-2">Reference images</label>
            <div className="flex flex-wrap gap-2">
              {references.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRef(selectedRef === r.public_url ? null : r.public_url)}
                  className={`relative w-16 h-16 rounded-md overflow-hidden border-2 ${
                    selectedRef === r.public_url ? 'border-accent' : 'border-white/10'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {r.public_url && <img src={r.public_url} alt={r.label ?? ''} className="w-full h-full object-cover" />}
                </button>
              ))}
              {references.length === 0 && <p className="text-xs text-white/40">No references uploaded</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-2">Panel prompt</label>
            <pre className="bg-surface border border-white/10 rounded-lg p-3 text-[11px] font-mono text-white/60 whitespace-pre-wrap">
              {panel.prompt}
            </pre>
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-2">Edit history</label>
            <div className="space-y-1 max-h-40 overflow-auto">
              {history.length === 0 && <p className="text-xs text-white/40">No edits yet</p>}
              {history.map((h, i) => (
                <div key={i} className="bg-surface border border-white/10 rounded px-2 py-1.5 text-xs">
                  <div className="text-white/80 truncate">{h.prompt}</div>
                  <div className="text-white/40 text-[10px]">{h.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={regenerate} loading={loading}>Regenerate</Button>
            <Button variant="ghost" onClick={() => setToast({ msg: 'Saved', type: 'success' })}>Save</Button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
