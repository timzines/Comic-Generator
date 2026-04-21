'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { WizardForm } from '@/app/(dashboard)/new/page';
import { Button } from '@/components/ui/Button';
import { ARCHETYPES, ARCHETYPE_KEYS, type ArchetypeKey } from '@/lib/story/archetypes';

interface UploadedRef { id: string; publicUrl: string; label: string; localPreview?: string }

interface Props {
  form: WizardForm;
  setForm: (f: WizardForm) => void;
  loading: boolean;
  ensureComic: () => Promise<string>;
  onNext: () => void;
}

export function StepDescribe({ form, setForm, loading, ensureComic, onNext }: Props) {
  const [refs, setRefs] = useState<UploadedRef[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      setUploading(true);
      try {
        const comicId = await ensureComic();
        for (const file of accepted) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('comicId', comicId);
          const res = await fetch('/api/image/upload-reference', { method: 'POST', body: fd });
          if (res.ok) {
            const { referenceImage } = (await res.json()) as { referenceImage: UploadedRef };
            setRefs((prev) => [...prev, referenceImage]);
          }
        }
      } finally {
        setUploading(false);
      }
    },
    [ensureComic]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const canNext = form.title && form.description;

  function setArchetype(next: ArchetypeKey | null) {
    setForm({ ...form, archetype: next ?? undefined });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-extrabold">Describe your comic</h1>
      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Title"
        className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Describe your world, characters, tone, and what you want to happen…"
        className="w-full min-h-[160px] bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
      />

      <div>
        <div className="text-sm text-white/60 mb-2">Format</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setArchetype(null)}
            className={`text-left p-3 rounded-lg border transition ${
              !form.archetype ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/30'
            }`}
          >
            <div className="font-semibold text-sm">Long-form manga</div>
            <div className="text-xs text-white/50 mt-1">3–8 pages, multi-act story. Original behavior.</div>
          </button>
          {ARCHETYPE_KEYS.map((key) => {
            const a = ARCHETYPES[key];
            const active = form.archetype === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setArchetype(key)}
                className={`text-left p-3 rounded-lg border transition ${
                  active ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="font-semibold text-sm">4-panel · {a.name}</div>
                <div className="text-xs text-white/50 mt-1">{a.summary}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-sm text-white/60 mb-2">Character reference images (optional)</div>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
            isDragActive ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/30'
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-white/60 text-sm">
            {uploading ? 'Uploading…' : 'Drag & drop images here, or click to browse'}
          </p>
        </div>
        {refs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {refs.map((r) => (
              <div key={r.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.publicUrl} alt={r.label} className="w-20 h-20 object-cover rounded-md border border-white/10" />
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={onNext} loading={loading} disabled={!canNext} size="lg">
        Search for inspiration →
      </Button>
      {loading && <p className="text-white/50 text-sm">Grok is searching the internet…</p>}
    </div>
  );
}
