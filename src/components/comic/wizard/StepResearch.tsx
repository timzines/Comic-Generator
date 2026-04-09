'use client';
import type { ResearchResponse } from '@/types/api';
import { Button } from '@/components/ui/Button';

interface Props { research: ResearchResponse; loading: boolean; onNext: () => void }

export function StepResearch({ research, loading, onNext }: Props) {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold">Inspiration found</h1>
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 mb-3">Inspirations</h2>
        <ol className="space-y-2">
          {research.inspirations.map((i, idx) => (
            <li key={idx} className="flex gap-3 bg-surface border border-white/10 rounded-lg p-4">
              <span className="text-accent font-bold">{idx + 1}.</span>
              <span className="text-white/80">{i}</span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 mb-3">Thematic angles</h2>
        <div className="flex flex-wrap gap-2">
          {research.themes.map((t, idx) => (
            <span key={idx} className="px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm">
              {t}
            </span>
          ))}
        </div>
      </section>
      <p className="text-xs text-white/40">Research powered by Grok + live web search</p>
      <Button onClick={onNext} loading={loading} size="lg">See story options →</Button>
    </div>
  );
}
