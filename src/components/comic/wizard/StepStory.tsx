'use client';
import type { StoryOptionData } from '@/types/api';
import { Button } from '@/components/ui/Button';

interface Props {
  options: StoryOptionData[];
  selected: number | null;
  setSelected: (i: number) => void;
  loading: boolean;
  onNext: () => void;
}

export function StepStory({ options, selected, setSelected, loading, onNext }: Props) {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-extrabold">Pick a story</h1>
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
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 uppercase">{o.tone}</span>
            </div>
            <p className="italic text-white/70 mb-4">{o.logline}</p>
            <div className="space-y-2">
              {o.actBreakdown.map((a, j) => (
                <div key={j} className="border-l-2 border-accent/50 pl-3">
                  <div className="text-[10px] uppercase text-white/50">{a.act}</div>
                  <div className="text-sm text-white/80">{a.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-white/50">{o.estimatedPanels} panels</div>
          </button>
        ))}
      </div>
      <Button onClick={onNext} loading={loading} disabled={selected === null} size="lg">
        Generate storyboard →
      </Button>
      {loading && <p className="text-white/50 text-sm">Writing panel prompts…</p>}
    </div>
  );
}
