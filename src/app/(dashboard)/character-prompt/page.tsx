'use client';
import { useCallback, useRef, useState } from 'react';
import type { CharacterSheet } from '@/lib/character/types';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

const LOADING_MESSAGES = [
  'Examining face geometry...',
  'Measuring hair styling...',
  'Cataloging clothing layers...',
  'Identifying art style anchors...',
  'Mapping color values to hex codes...',
  'Analyzing distinguishing features...',
  'Assembling master prompt...',
];

function resizeImage(file: File, maxSize: number): Promise<{ imageBase64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const base64 = dataUrl.split(',')[1];
        resolve({ imageBase64: base64, mediaType: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ColorSwatch({ hex }: { hex: string }) {
  if (!hex || !hex.startsWith('#')) return null;
  return (
    <span
      className="inline-block w-3 h-3 rounded-full border border-white/20 align-middle ml-1"
      style={{ backgroundColor: hex }}
      title={hex}
    />
  );
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
    >
      {copied ? 'Copied!' : label ?? 'Copy'}
    </button>
  );
}

function DownloadBtn({ text, filename }: { text: string; filename: string }) {
  return (
    <button
      onClick={() => {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
      className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
    >
      Download .txt
    </button>
  );
}

export default function CharacterPromptPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ imageBase64: string; mediaType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [sheet, setSheet] = useState<CharacterSheet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setSheet(null);
    setError(null);
    const data = await resizeImage(file, 2048);
    setImageData(data);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  async function analyze() {
    if (!imageData) return;
    setLoading(true);
    setError(null);
    setSheet(null);

    // Cycle loading messages
    let idx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[idx]);
    }, 3000);

    try {
      const res = await fetch('/api/character/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || 'Analysis failed');
      }
      const { sheet: result } = (await res.json()) as { sheet: CharacterSheet };
      setSheet(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderSection(title: string, key: string, content: React.ReactNode) {
    const isOpen = expandedSections.has(key);
    return (
      <div key={key} className="border border-white/10 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(key)}
          className="w-full text-left px-4 py-3 text-sm font-semibold flex items-center justify-between hover:bg-white/5 transition"
        >
          {title}
          <span className="text-white/40">{isOpen ? '\u25BE' : '\u25B8'}</span>
        </button>
        {isOpen && <div className="px-4 pb-4 text-sm text-white/70 space-y-1">{content}</div>}
      </div>
    );
  }

  function renderKV(label: string, value: string, hex?: string) {
    return (
      <div className="flex gap-2">
        <span className="text-white/40 shrink-0 w-32">{label}:</span>
        <span>{value}{hex && <ColorSwatch hex={hex} />}</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-extrabold mb-2">Character Prompt Generator</h1>
      <p className="text-white/50 text-sm mb-8">
        Upload a character image. Get a detailed, structured prompt optimized for Grok Imagine.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upload */}
        <div className="space-y-4">
          <div
            ref={dropRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl cursor-pointer transition min-h-[400px] flex items-center justify-center ${
              preview ? 'border-white/20' : 'border-white/10 hover:border-white/30'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Character preview" className="max-h-[500px] w-auto rounded-lg" />
            ) : (
              <div className="text-center text-white/40 px-8">
                <div className="text-5xl mb-4">+</div>
                <div className="text-sm">Drop a character image here, or click to upload</div>
                <div className="text-xs mt-2 text-white/30">JPG, PNG, WebP &mdash; max 10MB</div>
              </div>
            )}
          </div>

          {preview && (
            <div className="flex gap-2">
              <Button onClick={analyze} loading={loading} disabled={!imageData} size="lg" className="flex-1">
                Generate Character Prompt
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setPreview(null);
                  setImageData(null);
                  setSheet(null);
                  setError(null);
                }}
              >
                Clear
              </Button>
            </div>
          )}

          {loading && (
            <div className="bg-surface border border-accent/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
                <span className="text-sm text-white/60">{loadingMsg}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {sheet ? (
            <>
              {/* Anchor tag */}
              <div
                className="bg-accent/10 border border-accent/30 rounded-lg p-4 cursor-pointer hover:bg-accent/15 transition"
                onClick={() => {
                  navigator.clipboard.writeText(sheet.anchor_tag);
                  setToast('Anchor tag copied!');
                }}
              >
                <div className="text-xs text-white/50 mb-1">Anchor Tag (click to copy)</div>
                <div className="text-2xl font-extrabold text-accent">{sheet.anchor_tag}</div>
                <div className="text-sm text-white/60 mt-1">{sheet.character_summary}</div>
              </div>

              {/* Master prompt */}
              <div className="bg-surface border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white/50 uppercase">Master Prompt</span>
                  <div className="flex gap-2">
                    <CopyBtn text={sheet.master_prompt} label="Copy Prompt" />
                    <DownloadBtn text={sheet.master_prompt} filename={`${sheet.anchor_tag.replace(/\s+/g, '-')}-prompt.txt`} />
                  </div>
                </div>
                <pre className="font-mono text-xs text-white/80 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                  {sheet.master_prompt}
                </pre>
              </div>

              {/* Negative prompt */}
              {sheet.negative_prompt_elements.length > 0 && (
                <div className="bg-surface border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white/50 uppercase">Negative Prompt</span>
                    <CopyBtn text={`Avoid: ${sheet.negative_prompt_elements.join(', ')}.`} label="Copy" />
                  </div>
                  <p className="text-sm text-red-300/80">
                    Avoid: {sheet.negative_prompt_elements.join(', ')}.
                  </p>
                </div>
              )}

              {/* Character sheet accordion */}
              <div className="space-y-2">
                {renderSection('Face', 'face', (
                  <>
                    {renderKV('Shape', sheet.face.shape)}
                    {renderKV('Proportions', sheet.face.proportions)}
                    {renderKV('Jawline', sheet.face.jawline)}
                    {renderKV('Cheekbones', sheet.face.cheekbones)}
                    {renderKV('Forehead', sheet.face.forehead)}
                    {renderKV('Chin', sheet.face.chin)}
                  </>
                ))}
                {renderSection('Eyes', 'eyes', (
                  <>
                    {renderKV('Shape', sheet.eyes.shape)}
                    {renderKV('Size', sheet.eyes.size)}
                    {renderKV('Iris Color', `${sheet.eyes.iris_color_name} (${sheet.eyes.iris_color_hex})`, sheet.eyes.iris_color_hex)}
                    {renderKV('Iris Style', sheet.eyes.iris_style)}
                    {renderKV('Pupil', sheet.eyes.pupil)}
                    {renderKV('Eyelashes', sheet.eyes.eyelashes)}
                    {renderKV('Eyebrows', sheet.eyes.eyebrows)}
                    {renderKV('Spacing', sheet.eyes.eye_spacing)}
                  </>
                ))}
                {renderSection('Hair', 'hair', (
                  <>
                    {renderKV('Color', `${sheet.hair.base_color_name} (${sheet.hair.base_color_hex})`, sheet.hair.base_color_hex)}
                    {renderKV('Highlights', sheet.hair.highlights)}
                    {renderKV('Length', sheet.hair.length)}
                    {renderKV('Style', sheet.hair.overall_style)}
                    {renderKV('Bangs', sheet.hair.bangs)}
                    {renderKV('Part', sheet.hair.partline)}
                    {renderKV('Texture', sheet.hair.texture)}
                    {sheet.hair.notable_locks.length > 0 && renderKV('Notable', sheet.hair.notable_locks.join('; '))}
                  </>
                ))}
                {renderSection('Skin', 'skin', (
                  <>
                    {renderKV('Tone', `${sheet.skin.tone_name} (${sheet.skin.tone_hex})`, sheet.skin.tone_hex)}
                    {renderKV('Undertone', sheet.skin.undertone)}
                    {renderKV('Shading', sheet.skin.shading_style)}
                    {sheet.skin.marks.length > 0 && renderKV('Marks', sheet.skin.marks.join('; '))}
                  </>
                ))}
                {renderSection('Body', 'body', (
                  <>
                    {renderKV('Build', sheet.body.build)}
                    {renderKV('Height', sheet.body.height_impression)}
                    {renderKV('Proportions', sheet.body.proportions)}
                    {sheet.body.notable_features.length > 0 && renderKV('Features', sheet.body.notable_features.join('; '))}
                  </>
                ))}
                {renderSection('Clothing', 'clothing', (
                  <div className="space-y-3">
                    {sheet.clothing.map((c, i) => (
                      <div key={i} className="border-l-2 border-accent/30 pl-3">
                        <div className="font-semibold text-white/80">{c.item} <span className="text-white/40 text-xs">({c.layer})</span></div>
                        <div>{c.color_name} ({c.color_hex})<ColorSwatch hex={c.color_hex} /> &mdash; {c.fabric}, {c.fit}</div>
                        {c.details.length > 0 && <div className="text-white/50">{c.details.join(', ')}</div>}
                      </div>
                    ))}
                  </div>
                ))}
                {sheet.accessories.length > 0 && renderSection('Accessories', 'accessories', (
                  <div className="space-y-2">
                    {sheet.accessories.map((a, i) => (
                      <div key={i}>
                        <span className="font-semibold text-white/80">{a.item}</span>
                        <span className="text-white/40"> at {a.placement}</span>
                        <span> &mdash; {a.material}, {a.details}</span>
                        <ColorSwatch hex={a.color_hex} />
                      </div>
                    ))}
                  </div>
                ))}
                {renderSection('Art Style', 'art_style', (
                  <>
                    {renderKV('Overall', sheet.art_style.overall)}
                    {renderKV('Line Weight', sheet.art_style.line_weight)}
                    {renderKV('Shading', sheet.art_style.shading)}
                    {renderKV('Screentone', sheet.art_style.screentone_usage)}
                    {sheet.art_style.reference_artists.length > 0 && renderKV('References', sheet.art_style.reference_artists.join(', '))}
                    {renderKV('Palette', sheet.art_style.color_palette_mood)}
                  </>
                ))}
                {sheet.distinguishing_features.length > 0 && renderSection('Distinguishing Features', 'distinguishing', (
                  <ul className="list-disc list-inside space-y-1">
                    {sheet.distinguishing_features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                ))}
              </div>

              {/* Raw JSON */}
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowJson(!showJson)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold flex items-center justify-between hover:bg-white/5 transition"
                >
                  Raw JSON
                  <div className="flex gap-2 items-center">
                    <CopyBtn text={JSON.stringify(sheet, null, 2)} label="Copy JSON" />
                    <span className="text-white/40">{showJson ? '\u25BE' : '\u25B8'}</span>
                  </div>
                </button>
                {showJson && (
                  <pre className="px-4 pb-4 font-mono text-[10px] text-white/60 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {JSON.stringify(sheet, null, 2)}
                  </pre>
                )}
              </div>

              {/* Regenerate */}
              <Button variant="ghost" onClick={analyze} loading={loading} className="w-full">
                Regenerate Analysis
              </Button>
            </>
          ) : !loading && (
            <div className="flex items-center justify-center h-full text-white/30 text-sm">
              Upload a character image to get started
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
