'use client';
import { useState } from 'react';
import type { StoryOptionData } from '@/types/api';
import { Button } from '@/components/ui/Button';

interface Props {
  options: StoryOptionData[];
  selected: number | null;
  setSelected: (i: number) => void;
  loading: boolean;
  onNext: () => void;
  onEdit: (prompt: string) => void;
  editing: boolean;
}

export function StepStory({ options, selected, setSelected, loading, onNext, onEdit, editing }: Props) {
  const [editPrompt, setEditPrompt] = useState('');
  const [showPages, setShowPages] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-extrabold">Pick a storyline</h1>
      <div className="space-y-4">
        {options.map((o, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            className={`w-full text-left p-6 rounded-xl border transition ${
              selected === i ? 'border-accent bg-accent/5 shadow-[0_0_0_1px_rgba(200,255,0,0.3)]' : 'border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold">{o.title}</h3>
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 uppercase">{o.tone}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent">
                  {o.estimatedPages} pages · {o.estimatedPanels} panels
                </span>
              </div>
            </div>
            <p className="italic text-white/70 mb-4">{o.logline}</p>

            <div className="space-y-2 mb-4">
              {o.actBreakdown.map((a, j) => (
                <div key={j} className="border-l-2 border-accent/50 pl-3">
                  <div className="text-[10px] uppercase text-white/50">{a.act}</div>
                  <div className="text-sm text-white/80">{a.desc}</div>
                </div>
              ))}
            </div>

            {selected === i && o.pageStructure && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowPages(showPages === i ? null : i); }}
                  className="text-xs text-accent hover:text-accent/80 font-semibold"
                >
                  {showPages === i ? '▾ Hide page breakdown' : '▸ Show page breakdown'}
                </button>
                {showPages === i && (
                  <div className="mt-3 space-y-3">
                    {o.pageStructure.map((page) => (
                      <div key={page.pageNumber} className="bg-black/20 rounded-lg p-3">
                        <div className="text-xs font-bold text-white/60 mb-2">
                          Page {page.pageNumber} · {page.panelCount} panels
                        </div>
                        <div className="space-y-1.5">
                          {page.panels.map((panel) => (
                            <div key={panel.position} className="flex gap-2 text-xs">
                              <span className="text-accent/60 font-mono shrink-0">P{panel.position + 1}</span>
                              <div>
                                <span className="text-white/70">{panel.description}</span>
                                {panel.dialog && (
                                  <span className="ml-2 text-white/40 italic">{"\u201C"}{panel.dialog}{"\u201D"}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {selected !== null && (
        <div className="bg-surface border border-white/10 rounded-lg p-4">
          <div className="text-sm font-semibold text-white/60 mb-2">Edit storyline with a prompt</div>
          <div className="flex gap-2">
            <input
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g. Make it darker, add a plot twist in act 2..."
              className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <Button
              onClick={() => { if (editPrompt.trim()) onEdit(editPrompt.trim()); }}
              loading={editing}
              disabled={!editPrompt.trim()}
              size="sm"
            >
              Edit
            </Button>
          </div>
        </div>
      )}

      <Button onClick={onNext} loading={loading} disabled={selected === null} size="lg">
        Generate storyboard →
      </Button>
      {loading && <p className="text-white/50 text-sm">Writing panel prompts…</p>}
    </div>
  );
}
