'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';

interface PanelData {
  id: string;
  panelIndex: number;
  pageNumber: number;
  positionInPage: number;
  prompt: string;
  dialog: string | null;
}

interface Props {
  panels: PanelData[];
  characterBible: string;
  onDraft: () => void;
  onGenerate: () => void;
}

export function StepPanels({ panels, characterBible, onDraft, onGenerate }: Props) {
  const [open, setOpen] = useState(false);

  // Group panels by page
  const pages = new Map<number, PanelData[]>();
  for (const p of panels) {
    const arr = pages.get(p.pageNumber) ?? [];
    arr.push(p);
    pages.set(p.pageNumber, arr);
  }
  const sortedPages = [...pages.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold">Storyboard ready</h1>
        <p className="text-white/50 mt-1">{sortedPages.length} pages &middot; {panels.length} panels drafted</p>
      </div>

      {sortedPages.map(([pageNum, pagePanels]) => (
        <div key={pageNum} className="bg-surface/50 border border-white/10 rounded-xl p-4">
          <div className="text-sm font-bold text-white/60 mb-3">
            Page {pageNum} &middot; {pagePanels.length} panels
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {pagePanels
              .sort((a, b) => a.positionInPage - b.positionInPage)
              .map((p) => (
                <div key={p.id} className="bg-surface border border-white/10 rounded-lg overflow-hidden">
                  <PlaceholderImage index={p.panelIndex} />
                  <div className="p-2">
                    <div className="text-[10px] text-white/50 line-clamp-2">{p.prompt}</div>
                    {p.dialog && (
                      <div className="mt-1 text-[10px] text-accent/70 italic line-clamp-1">
                        &ldquo;{p.dialog}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <div className="bg-surface border border-white/10 rounded-lg">
        <button onClick={() => setOpen(!open)} className="w-full text-left p-4 text-sm font-semibold">
          {open ? '▾' : '▸'} Character bible
        </button>
        {open && <pre className="px-4 pb-4 font-mono text-xs text-white/70 whitespace-pre-wrap">{characterBible}</pre>}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onDraft}>Save as draft</Button>
        <Button onClick={onGenerate} size="lg">Start generating →</Button>
      </div>
    </div>
  );
}
