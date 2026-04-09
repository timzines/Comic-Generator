'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { WizardForm } from '@/app/(dashboard)/new/page';
import { Button } from '@/components/ui/Button';

const STYLES = [
  { key: 'Manga', desc: 'Ink-heavy, screentones' },
  { key: 'Noir', desc: 'High contrast, cinematic' },
  { key: 'Watercolor', desc: 'Soft edges, painted' },
  { key: 'Western Comics', desc: 'Bold lines, bright' },
  { key: 'Pixel Art', desc: '8-bit retro' },
  { key: 'Custom', desc: 'Your own style' },
];

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

  const canNext = form.title && form.genre && form.description && form.style && (form.style !== 'Custom' || form.customStyle);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-extrabold">Describe your comic</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
          className="bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
        />
        <input
          value={form.genre}
          onChange={(e) => setForm({ ...form, genre: e.target.value })}
          placeholder="Genre (sci-fi, horror, romance…)"
          className="bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
        />
      </div>
      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Describe your world, characters, tone, and what you want to happen…"
        className="w-full min-h-[160px] bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
      />

      <div>
        <div className="text-sm text-white/60 mb-3">Art style</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setForm({ ...form, style: s.key })}
              className={`text-left p-4 rounded-lg border transition ${
                form.style === s.key ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="font-bold">{s.key}</div>
              <div className="text-xs text-white/50 mt-1">{s.desc}</div>
            </button>
          ))}
        </div>
        {form.style === 'Custom' && (
          <input
            value={form.customStyle}
            onChange={(e) => setForm({ ...form, customStyle: e.target.value })}
            placeholder="Describe your custom style…"
            className="mt-3 w-full bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
          />
        )}
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
