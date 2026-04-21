'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { ARCHETYPES, ARCHETYPE_KEYS, type ArchetypeKey } from '@/lib/story/archetypes';
import type { AutopilotEvent, AutopilotStage } from '@/types/api';

interface QueuedRun {
  key: string;
  title: string;
  description: string;
  archetype?: ArchetypeKey;
}

interface RunLogLine {
  time: string;
  text: string;
  kind: 'info' | 'score' | 'panel' | 'error' | 'done';
}

interface PendingReviewComic {
  id: string;
  title: string;
  description: string | null;
  archetype: string | null;
  panel_count: number;
  created_at: string;
  panels: { id: string; panel_index: number; image_url: string | null; status: string }[];
}

const STAGE_LABEL: Record<AutopilotStage, string> = {
  create: 'Creating comic…',
  research: 'Researching inspiration…',
  options: 'Writing story options…',
  score: 'Scoring viral potential…',
  select: 'Building character bible…',
  panels: 'Writing panel prompts…',
  images: 'Generating panel images…',
  done: 'Done',
};

export function FactoryClient() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [archetype, setArchetype] = useState<ArchetypeKey | ''>('oh-no');
  const [count, setCount] = useState(1);

  const [queue, setQueue] = useState<QueuedRun[]>([]);
  const [active, setActive] = useState<QueuedRun | null>(null);
  const [stage, setStage] = useState<AutopilotStage | null>(null);
  const [activeComicId, setActiveComicId] = useState<string | null>(null);
  const [log, setLog] = useState<RunLogLine[]>([]);
  const [panelProgress, setPanelProgress] = useState<{ done: number; errors: number; total: number }>({
    done: 0,
    errors: 0,
    total: 0,
  });
  const running = useRef(false);

  const [pending, setPending] = useState<PendingReviewComic[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await fetch('/api/comic/pending-review');
      if (!res.ok) return;
      const data = (await res.json()) as { comics: PendingReviewComic[] };
      setPending(data.comics);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  function pushLog(text: string, kind: RunLogLine['kind'] = 'info') {
    setLog((prev) => [...prev, { time: new Date().toLocaleTimeString(), text, kind }]);
  }

  const runOne = useCallback(
    async (run: QueuedRun) => {
      setActive(run);
      setStage(null);
      setActiveComicId(null);
      setLog([]);
      setPanelProgress({ done: 0, errors: 0, total: 0 });

      const res = await fetch('/api/comic/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: run.title,
          description: run.description,
          archetype: run.archetype,
        }),
      });
      if (!res.ok || !res.body) {
        pushLog(`Request failed ${res.status}`, 'error');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.replace(/^data:\s*/, '').trim();
          if (!line) continue;
          try {
            const event = JSON.parse(line) as AutopilotEvent;
            handleEvent(event);
          } catch {
            // ignore
          }
        }
      }
    },
    [],
  );

  function handleEvent(e: AutopilotEvent) {
    switch (e.type) {
      case 'start':
        setActiveComicId(e.comicId);
        pushLog(`Comic ${e.comicId.slice(0, 8)} created`);
        return;
      case 'stage':
        setStage(e.stage);
        pushLog(STAGE_LABEL[e.stage] + (e.detail ? ` — ${e.detail}` : ''));
        if (e.stage === 'images' && e.detail) {
          const m = e.detail.match(/(\d+)/);
          if (m) setPanelProgress({ done: 0, errors: 0, total: Number(m[1]) });
        }
        return;
      case 'score':
        pushLog(`Option ${e.optionIndex + 1}: ${e.score.toFixed(1)} — ${e.rationale}`, 'score');
        return;
      case 'selected':
        pushLog(`Picked option ${e.optionIndex + 1} (score ${e.score.toFixed(1)})`, 'info');
        return;
      case 'panel':
        setPanelProgress((p) => ({ ...p, done: p.done + 1 }));
        pushLog(`Panel ${e.panelIndex + 1} done`, 'panel');
        return;
      case 'panelError':
        setPanelProgress((p) => ({ ...p, errors: p.errors + 1 }));
        pushLog(`Panel ${e.panelIndex + 1} failed: ${e.message}`, 'error');
        return;
      case 'complete':
        pushLog(`Complete — ${e.panelCount} panels, ${e.errorCount} errors`, 'done');
        return;
      case 'error':
        pushLog(`${e.stage} failed: ${e.message}`, 'error');
        return;
    }
  }

  useEffect(() => {
    if (running.current) return;
    if (queue.length === 0) return;
    running.current = true;
    (async () => {
      while (true) {
        const next = queue[0];
        if (!next) break;
        await runOne(next);
        setQueue((prev) => prev.slice(1));
        await loadPending();
      }
      setActive(null);
      setStage(null);
      setActiveComicId(null);
      running.current = false;
    })();
  }, [queue, runOne, loadPending]);

  function launch() {
    if (!description.trim()) {
      setToast({ msg: 'Description is required', type: 'error' });
      return;
    }
    const safeCount = Math.max(1, Math.min(count, 5));
    const runs: QueuedRun[] = Array.from({ length: safeCount }).map((_, i) => ({
      key: `${Date.now()}-${i}`,
      title: title.trim() ? (safeCount > 1 ? `${title} ${i + 1}` : title) : '',
      description,
      archetype: archetype || undefined,
    }));
    setQueue((prev) => [...prev, ...runs]);
  }

  async function approve(comicId: string) {
    const res = await fetch('/api/comic/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comicId }),
    });
    if (!res.ok) {
      setToast({ msg: 'Approve failed', type: 'error' });
      return;
    }
    setToast({ msg: 'Moved to library', type: 'success' });
    await loadPending();
  }

  async function reject(comicId: string) {
    if (!confirm('Delete this comic permanently?')) return;
    const res = await fetch('/api/comic/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comicId }),
    });
    if (!res.ok) {
      setToast({ msg: 'Reject failed', type: 'error' });
      return;
    }
    setToast({ msg: 'Rejected', type: 'success' });
    await loadPending();
  }

  const activeProgress = useMemo(() => {
    if (!panelProgress.total) return null;
    const pct = Math.round(((panelProgress.done + panelProgress.errors) / panelProgress.total) * 100);
    return `${panelProgress.done}/${panelProgress.total} panels${
      panelProgress.errors ? ` · ${panelProgress.errors} errors` : ''
    } (${pct}%)`;
  }, [panelProgress]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Factory</h1>
        <p className="text-white/50 text-sm mt-1">Batch-generate yonkoma strips. Human review gate before they hit the library.</p>
      </div>

      <section className="bg-surface border border-white/10 rounded-lg p-5 space-y-4">
        <h2 className="font-bold">Launch batch</h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4">
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional title prefix"
              className="w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the strip concept (required)…"
              className="w-full min-h-[110px] bg-bg border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Archetype</label>
              <select
                value={archetype}
                onChange={(e) => setArchetype(e.target.value as ArchetypeKey | '')}
                className="w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
              >
                <option value="">Long-form (no archetype)</option>
                {ARCHETYPE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {ARCHETYPES[k].name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Count (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <Button onClick={launch} className="w-full">
              Launch {count > 1 ? `${count} comics` : 'comic'}
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-white/10 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Active run</h2>
          <span className="text-xs text-white/40">
            {active ? `running · ${queue.length - 1} queued` : queue.length > 0 ? 'starting…' : 'idle'}
          </span>
        </div>
        {active ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">{active.title || 'Untitled'}</div>
                <div className="text-xs text-white/50 mt-0.5 line-clamp-2">{active.description}</div>
              </div>
              <div className="text-xs text-white/60 text-right">
                {stage && STAGE_LABEL[stage]}
                {activeProgress && <div className="text-white/80 font-mono mt-0.5">{activeProgress}</div>}
                {activeComicId && (
                  <Link
                    href={`/comic/${activeComicId}/storyboard`}
                    className="text-accent hover:underline mt-0.5 inline-block"
                  >
                    Open →
                  </Link>
                )}
              </div>
            </div>
            <div className="bg-bg border border-white/5 rounded p-2 max-h-48 overflow-auto font-mono text-[11px] leading-5">
              {log.map((l, i) => (
                <div
                  key={i}
                  className={
                    l.kind === 'error'
                      ? 'text-red-300'
                      : l.kind === 'score'
                      ? 'text-accent'
                      : l.kind === 'done'
                      ? 'text-green-300'
                      : 'text-white/70'
                  }
                >
                  <span className="text-white/30 mr-2">{l.time}</span>
                  {l.text}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-white/40">No runs in progress. Launch a batch to begin.</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Review queue</h2>
          <Button variant="ghost" onClick={loadPending} loading={loadingPending}>
            Reload
          </Button>
        </div>
        {pending.length === 0 ? (
          <p className="text-xs text-white/40">Nothing awaiting review. Completed comics land here before you send them to the library.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map((c) => (
              <PendingCard key={c.id} comic={c} onApprove={() => approve(c.id)} onReject={() => reject(c.id)} />
            ))}
          </div>
        )}
      </section>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function PendingCard({
  comic,
  onApprove,
  onReject,
}: {
  comic: PendingReviewComic;
  onApprove: () => void;
  onReject: () => void;
}) {
  const first = comic.panels.find((p) => p.image_url);
  const errorCount = comic.panels.filter((p) => p.status === 'error').length;
  return (
    <div className="bg-surface border border-white/10 rounded-lg overflow-hidden flex flex-col">
      <Link href={`/comic/${comic.id}/storyboard`} className="aspect-video bg-bg block">
        {first?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={first.image_url} alt={comic.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">no preview</div>
        )}
      </Link>
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{comic.title}</h3>
          {comic.archetype && (
            <span className="text-[10px] uppercase bg-accent/15 text-accent px-1.5 py-0.5 rounded">
              {comic.archetype.replace(/-/g, ' ')}
            </span>
          )}
        </div>
        <div className="text-[11px] text-white/50">
          {comic.panel_count} panels{errorCount ? ` · ${errorCount} errors` : ''} · {new Date(comic.created_at).toLocaleString()}
        </div>
        <div className="grid grid-cols-4 gap-1 mt-1">
          {comic.panels.slice(0, 4).map((p) => (
            <div key={p.id} className="aspect-square bg-bg rounded overflow-hidden">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5" />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={onApprove}
            className="flex-1 bg-accent text-bg text-xs font-semibold py-1.5 rounded hover:opacity-90"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 bg-white/5 text-white/70 text-xs font-semibold py-1.5 rounded hover:bg-white/10"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
