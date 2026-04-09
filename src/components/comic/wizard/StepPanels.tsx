'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';

interface Props {
  panels: { id: string; panelIndex: number; prompt: string }[];
  characterBible: string;
  onDraft: () => void;
  onGenerate: () => void;
}

export function StepPanels({ panels, characterBible, onDraft, onGenerate }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold">Storyboard ready</h1>
        <p className="text-white/50 mt-1">{panels.length} panels drafted</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {panels.map((p) => (
          <div key={p.id} className="bg-surface border border-white/10 rounded-lg overflow-hidden">
            <PlaceholderImage index={p.panelIndex} />
            <div className="p-2 text-[10px] text-white/50 line-clamp-2">{p.prompt}</div>
          </div>
        ))}
      </div>

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
