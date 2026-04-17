'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Comic, Panel, ReferenceImage, PanelStatus } from '@/types/database';
import type { SSEEvent } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { PagePreview } from '@/components/comic/PagePreview';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';

interface Props {
  comic: Comic;
  initialPanels: Panel[];
  references: ReferenceImage[];
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition shrink-0"
      title={`Copy ${label ?? 'prompt'}`}
    >
      {copied ? 'Copied!' : label ?? 'Copy'}
    </button>
  );
}

export function StoryboardClient({ comic, initialPanels }: Props) {
  const [panels, setPanels] = useState(initialPanels);
  const [progress, setProgress] = useState({ generated: 0, total: 0 });
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [streamId, setStreamId] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'pages'>('pages');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<{ id: string; prompt: string } | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

  const doneCount = panels.filter((p) => p.status === 'done').length;

  // Group panels by page
  const pages = new Map<number, Panel[]>();
  for (const p of panels) {
    const pageNum = p.page_number || 1;
    const arr = pages.get(pageNum) ?? [];
    arr.push(p);
    pages.set(pageNum, arr);
  }
  const sortedPages = [...pages.entries()].sort(([a], [b]) => a - b);

  // SSE for batch generation
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

  const regeneratePanel = useCallback(async (panelId: string) => {
    setRegeneratingId(panelId);
    setPanels((prev) => prev.map((p) => (p.id === panelId ? { ...p, status: 'generating' as PanelStatus } : p)));
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panelId, comicId: comic.id }),
      });
      if (!res.ok) throw new Error('Regenerate failed');
      const { imageUrl } = (await res.json()) as { imageUrl: string };
      setPanels((prev) => prev.map((p) => (p.id === panelId ? { ...p, status: 'done' as PanelStatus, image_url: imageUrl } : p)));
      setToast('Panel regenerated!');
    } catch {
      setPanels((prev) => prev.map((p) => (p.id === panelId ? { ...p, status: 'error' as PanelStatus } : p)));
      setToast('Regeneration failed');
    } finally {
      setRegeneratingId(null);
    }
  }, [comic.id]);

  const editPanel = useCallback(async (panelId: string, ep: string) => {
    setRegeneratingId(panelId);
    try {
      const res = await fetch('/api/image/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panelId, comicId: comic.id, editPrompt: ep }),
      });
      if (!res.ok) throw new Error('Edit failed');
      const { imageUrl } = (await res.json()) as { imageUrl: string };
      setPanels((prev) => prev.map((p) => (p.id === panelId ? { ...p, image_url: imageUrl } : p)));
      setEditingPrompt(null);
      setToast('Panel edited!');
    } catch {
      setToast('Edit failed');
    } finally {
      setRegeneratingId(null);
    }
  }, [comic.id]);

  function renderPanelPrompt(p: Panel) {
    const isExpanded = expandedPanel === p.id;
    const fullPrompt = `${p.prompt ?? ''}${comic.character_bible ? `\n\nArt style: Manga comic book art, ink-heavy, screentones, dynamic compositions.\n\n${comic.character_bible}` : ''}`;

    return (
      <div className="p-1.5">
        <div className="flex items-start gap-1">
          <div
            className={`text-[9px] text-white/50 flex-1 cursor-pointer ${isExpanded ? '' : 'line-clamp-1'}`}
            onClick={() => setExpandedPanel(isExpanded ? null : p.id)}
            title="Click to expand"
          >
            {p.prompt}
          </div>
          <CopyButton text={fullPrompt} label="Prompt" />
        </div>
        {p.dialog && (
          <div className="flex items-center gap-1 mt-0.5">
            <div className={`text-[9px] text-accent/70 italic flex-1 ${isExpanded ? '' : 'line-clamp-1'}`}>
              {"\u201C"}{p.dialog}{"\u201D"}
            </div>
            <CopyButton text={p.dialog} label="Dialog" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/dashboard" className="text-white/50 text-sm hover:text-white">{"\u2190"} Back to Dashboard</Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-extrabold">{comic.title}</h1>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent">Manga</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
              {sortedPages.length} pages · {panels.length} panels
            </span>
          </div>
          <p className="text-white/50 text-sm mt-2">{doneCount} of {panels.length} panels generated</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'pages' ? 'grid' : 'pages')}
            className="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
          >
            {viewMode === 'pages' ? 'Grid view' : 'Page view'}
          </button>
          <Link
            href={`/comic/${comic.id}/read`}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10"
          >
            Preview
          </Link>
          <button
            onClick={() => {
              const artStyle = 'Art style: Manga comic book art, ink-heavy, screentones, dynamic compositions.';
              const bible = comic.character_bible ? `\n${comic.character_bible}` : '';
              const all = panels
                .sort((a, b) => a.panel_index - b.panel_index)
                .map((p) => `--- Panel ${p.panel_index} (Page ${p.page_number || 1}) ---\n${p.prompt}\n${artStyle}${bible}${p.dialog ? `\nDialog: ${p.dialog}` : ''}`)
                .join('\n\n');
              navigator.clipboard.writeText(all);
              setToast('All prompts copied!');
            }}
            className="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
          >
            Copy All Prompts
          </button>
          <Button onClick={generateAll} loading={running}>Generate All</Button>
        </div>
      </div>

      {running && progress.total > 0 && (
        <div className="mb-6 p-4 bg-surface border border-accent/30 rounded-lg">
          <div className="flex justify-between text-xs text-white/60 mb-2">
            <span>Generating panels...</span>
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

      {viewMode === 'pages' ? (
        <div className="space-y-8">
          {sortedPages.map(([pageNum, pagePanels]) => (
            <div key={pageNum} className="bg-surface/30 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Page {pageNum}</h2>
                <span className="text-xs text-white/50">{pagePanels.length} panels</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-3">
                  {pagePanels
                    .sort((a, b) => (a.position_in_page ?? 0) - (b.position_in_page ?? 0))
                    .map((p) => (
                      <div key={p.id} className="bg-surface border border-white/10 rounded-lg overflow-hidden relative group">
                        <div className="absolute top-1.5 left-1.5 z-10 font-mono text-[9px] text-white/70 bg-black/50 px-1 py-0.5 rounded">
                          P{(p.position_in_page ?? 0) + 1}
                        </div>

                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt={`Panel ${p.panel_index}`} className="w-full aspect-[4/3] object-cover" />
                        ) : (
                          <PlaceholderImage aspectRatio="4/3" index={p.panel_index} />
                        )}

                        {p.status === 'generating' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="w-6 h-6 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
                          </div>
                        )}

                        {p.status === 'done' && regeneratingId !== p.id && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => regeneratePanel(p.id)}
                              className="text-[10px] font-semibold bg-white text-black px-3 py-1 rounded"
                            >
                              Regenerate
                            </button>
                            <button
                              onClick={() => setEditingPrompt({ id: p.id, prompt: '' })}
                              className="text-[10px] font-semibold bg-accent text-black px-3 py-1 rounded"
                            >
                              Edit
                            </button>
                          </div>
                        )}

                        {renderPanelPrompt(p)}
                      </div>
                    ))}
                </div>

                <PagePreview panels={pagePanels} pageIndex={pageNum - 1} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {panels
            .sort((a, b) => a.panel_index - b.panel_index)
            .map((p) => (
              <div key={p.id} className="bg-surface border border-white/10 rounded-lg overflow-hidden relative group">
                <div className="absolute top-2 left-2 z-10 font-mono text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
                  #{String(p.panel_index).padStart(2, '0')}
                </div>
                <div className="absolute top-2 right-2 z-10 text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                  Pg {p.page_number || 1}
                </div>

                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={`Panel ${p.panel_index}`} className="w-full aspect-video object-cover" />
                ) : (
                  <PlaceholderImage aspectRatio="16/9" index={p.panel_index} />
                )}

                {p.status === 'generating' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
                  </div>
                )}

                {p.status === 'done' && regeneratingId !== p.id && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => regeneratePanel(p.id)}
                      className="text-xs font-semibold bg-white text-black px-3 py-1.5 rounded"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => setEditingPrompt({ id: p.id, prompt: '' })}
                      className="text-xs font-semibold bg-accent text-black px-3 py-1.5 rounded"
                    >
                      Edit
                    </button>
                  </div>
                )}

                <div className="p-2">
                  <div className="flex items-start gap-1">
                    <div
                      className={`text-[10px] text-white/50 flex-1 cursor-pointer ${expandedPanel === p.id ? '' : 'line-clamp-2'}`}
                      onClick={() => setExpandedPanel(expandedPanel === p.id ? null : p.id)}
                    >
                      {p.prompt}
                    </div>
                    <CopyButton
                      text={`${p.prompt ?? ''}${comic.character_bible ? `\n\nArt style: Manga comic book art, ink-heavy, screentones, dynamic compositions.\n\n${comic.character_bible}` : ''}`}
                      label="Prompt"
                    />
                  </div>
                  {p.dialog && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="text-[10px] text-accent/70 italic flex-1 line-clamp-1">
                        {"\u201C"}{p.dialog}{"\u201D"}
                      </div>
                      <CopyButton text={p.dialog} label="Dialog" />
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Edit prompt modal */}
      {editingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setEditingPrompt(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-surface border border-white/10 rounded-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold mb-4">Edit panel</h2>
            <input
              value={editingPrompt.prompt}
              onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: e.target.value })}
              placeholder="Describe what to change..."
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-accent"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setEditingPrompt(null)}>Cancel</Button>
              <Button
                size="sm"
                loading={regeneratingId === editingPrompt.id}
                disabled={!editingPrompt.prompt.trim()}
                onClick={() => editPanel(editingPrompt.id, editingPrompt.prompt)}
              >
                Apply edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
