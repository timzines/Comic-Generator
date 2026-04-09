'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ResearchResponse, StoryOptionData } from '@/types/api';
import { StepDescribe } from '@/components/comic/wizard/StepDescribe';
import { StepResearch } from '@/components/comic/wizard/StepResearch';
import { StepStory } from '@/components/comic/wizard/StepStory';
import { StepPanels } from '@/components/comic/wizard/StepPanels';

export interface WizardForm {
  title: string;
  genre: string;
  style: string;
  customStyle: string;
  description: string;
  referenceImageIds: string[];
}

const STEPS = ['Describe', 'Research', 'Story', 'Panels'];

export default function NewComicPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [comicId, setComicId] = useState<string | null>(null);
  const [form, setForm] = useState<WizardForm>({
    title: '',
    genre: '',
    style: '',
    customStyle: '',
    description: '',
    referenceImageIds: [],
  });
  const [research, setResearch] = useState<ResearchResponse | null>(null);
  const [options, setOptions] = useState<StoryOptionData[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [characterBible, setCharacterBible] = useState<string>('');
  const [panels, setPanels] = useState<{ id: string; panelIndex: number; prompt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureComic(): Promise<string> {
    if (comicId) return comicId;
    const res = await fetch('/api/comic/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title || 'Untitled',
        description: form.description,
        genre: form.genre,
        style: form.style === 'Custom' ? form.customStyle : form.style,
        customStyle: form.style === 'Custom' ? form.customStyle : null,
      }),
    });
    if (!res.ok) throw new Error('could not create comic');
    const { id } = (await res.json()) as { id: string };
    setComicId(id);
    return id;
  }

  async function handleResearch() {
    setLoading(true);
    setError(null);
    try {
      const id = await ensureComic();
      const res = await fetch('/api/story/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicId: id,
          description: form.description,
          genre: form.genre,
          style: form.style === 'Custom' ? form.customStyle : form.style,
        }),
      });
      if (!res.ok) throw new Error('Research failed');
      setResearch((await res.json()) as ResearchResponse);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleOptions() {
    if (!comicId || !research) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/story/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicId,
          description: form.description,
          genre: form.genre,
          style: form.style === 'Custom' ? form.customStyle : form.style,
          research,
        }),
      });
      if (!res.ok) throw new Error('Story options failed');
      const data = (await res.json()) as { options: StoryOptionData[] };
      setOptions(data.options);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectAndPanels() {
    if (!comicId || selectedOption === null) return;
    setLoading(true);
    setError(null);
    try {
      const sel = await fetch('/api/story/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comicId, optionIndex: selectedOption }),
      });
      if (!sel.ok) throw new Error('Select failed');
      const { characterBible } = (await sel.json()) as { characterBible: string };
      setCharacterBible(characterBible);

      const res = await fetch('/api/story/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comicId }),
      });
      if (!res.ok) throw new Error('Panels failed');
      const { panels } = (await res.json()) as { panels: { id: string; panelIndex: number; prompt: string }[] };
      setPanels(panels);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                i <= step ? 'bg-accent text-bg border-accent' : 'border-white/10 text-white/40'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-xs ${i <= step ? 'text-white' : 'text-white/40'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/10" />}
          </div>
        ))}
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-sm">{error}</div>}

      {step === 0 && (
        <StepDescribe
          form={form}
          setForm={setForm}
          loading={loading}
          ensureComic={ensureComic}
          onNext={handleResearch}
        />
      )}
      {step === 1 && research && <StepResearch research={research} loading={loading} onNext={handleOptions} />}
      {step === 2 && (
        <StepStory
          options={options}
          selected={selectedOption}
          setSelected={setSelectedOption}
          loading={loading}
          onNext={handleSelectAndPanels}
        />
      )}
      {step === 3 && (
        <StepPanels
          panels={panels}
          characterBible={characterBible}
          onDraft={() => router.push('/dashboard')}
          onGenerate={() => router.push(`/comic/${comicId}/storyboard`)}
        />
      )}
    </div>
  );
}
