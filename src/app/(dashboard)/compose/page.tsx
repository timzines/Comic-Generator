'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { CharacterPicker } from '@/components/compose/CharacterPicker';
import { SceneForm } from '@/components/compose/SceneForm';
import { assembleScenePrompt } from '@/lib/scene/assembler';
import type { SceneCharacter, SceneInput } from '@/lib/scene/schema';
import { deleteScene, loadScenes, saveScene, type SavedScene } from '@/lib/scene/library';

const DEFAULT_SCENE: Omit<SceneInput, 'characters'> = {
  setting: {
    location: '',
    time_of_day: 'dusk',
    weather: undefined,
    environment_details: [],
  },
  camera: {
    shot_type: 'medium',
    angle: 'eye-level',
  },
  lighting: {
    key_light: '',
    mood: '',
  },
  mood: '',
  aspect_ratio: '16:9',
};

export default function ComposePage() {
  const [characters, setCharacters] = useState<SceneCharacter[]>([]);
  const [scene, setScene] = useState<Omit<SceneInput, 'characters'>>(DEFAULT_SCENE);
  const [composed, setComposed] = useState<string>('');
  const [showStructure, setShowStructure] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>([]);

  useEffect(() => {
    setSavedScenes(loadScenes());
  }, []);

  const fullInput: SceneInput = useMemo(
    () => ({ ...scene, characters }),
    [scene, characters],
  );

  const canCompose = characters.length > 0;
  const multi = characters.length >= 2;

  function compose() {
    if (!canCompose) return;
    const prompt = assembleScenePrompt(fullInput);
    setComposed(prompt);
    if (characters.length >= 4) {
      setToast('Heads up: 4 characters degrades consistency in Grok. Consider 2–3.');
    }
  }

  function copyPrompt() {
    navigator.clipboard.writeText(composed);
    setToast('Prompt copied!');
  }

  function downloadPrompt() {
    const blob = new Blob([composed], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const names = characters.map((c) => c.sheet.anchor_tag.split(' ').slice(0, 2).join('-')).join('_');
    a.download = `scene-${names || 'prompt'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSaveScene() {
    if (!composed) return;
    const name = window.prompt('Name this scene:', '');
    if (name === null) return;
    saveScene(name || 'Untitled scene', fullInput, composed);
    setSavedScenes(loadScenes());
    setToast('Scene saved!');
  }

  function handleLoadScene(s: SavedScene) {
    setCharacters(s.input.characters);
    setScene({
      setting: s.input.setting,
      camera: s.input.camera,
      lighting: s.input.lighting,
      mood: s.input.mood,
      interaction: s.input.interaction,
      art_style_override: s.input.art_style_override,
      aspect_ratio: s.input.aspect_ratio,
    });
    setComposed(s.prompt);
  }

  function handleDeleteScene(id: string) {
    if (!window.confirm('Delete this saved scene?')) return;
    deleteScene(id);
    setSavedScenes(loadScenes());
  }

  function regenerateVariation() {
    if (!canCompose) return;
    // Minor stylistic shuffle: swap camera/lighting sentence order by temporarily reshaping input.
    const reshuffled = assembleScenePrompt(fullInput);
    // Simple variation: swap first two sentence blocks after character blocks.
    const blocks = reshuffled.split('\n\n');
    if (blocks.length >= 4) {
      const charCount = characters.length;
      const head = blocks.slice(0, 1 + charCount + (multi && scene.interaction ? 1 : 0));
      const tail = blocks.slice(head.length);
      if (tail.length >= 2) {
        const [a, b, ...rest] = tail;
        setComposed([...head, b, a, ...rest].join('\n\n'));
        return;
      }
    }
    setComposed(reshuffled);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-extrabold mb-2">Scene Composer</h1>
      <p className="text-white/50 text-sm mb-8">
        Drop your saved characters into a scene. Composed locally — no LLM, no API call.
      </p>

      {savedScenes.length > 0 && (
        <div className="mb-8">
          <div className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
            Saved scenes ({savedScenes.length})
          </div>
          <div className="flex gap-2 flex-wrap">
            {savedScenes.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-1 bg-surface border border-white/10 rounded-full pl-3 pr-1 py-1 text-xs"
              >
                <button
                  onClick={() => handleLoadScene(s)}
                  className="text-white/80 hover:text-accent"
                >
                  {s.name}
                </button>
                <button
                  onClick={() => handleDeleteScene(s.id)}
                  className="text-red-300/60 hover:text-red-300 w-5 h-5 flex items-center justify-center rounded-full"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold mb-3">1. Pick characters</h2>
            <CharacterPicker selected={characters} onChange={setCharacters} />
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">2. Describe the scene</h2>
            <SceneForm value={scene} onChange={setScene} multiCharacter={multi} />
          </section>
        </div>

        {/* Right: output */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Button onClick={compose} size="lg" disabled={!canCompose} className="w-full">
            Compose Scene
          </Button>

          {characters.length >= 4 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-200">
              4 characters is Grok's coherence ceiling. Expect feature bleed — condenser runs at minimum budget.
            </div>
          )}

          {composed ? (
            <>
              <div className="bg-surface border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white/50 uppercase">
                    Composed Prompt
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={copyPrompt}
                      className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20"
                    >
                      Copy
                    </button>
                    <button
                      onClick={downloadPrompt}
                      className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20"
                    >
                      Download
                    </button>
                    <button
                      onClick={handleSaveScene}
                      className="text-xs px-2.5 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <pre className="font-mono text-xs text-white/80 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                  {composed}
                </pre>
              </div>

              <Button variant="ghost" onClick={regenerateVariation} className="w-full">
                Regenerate with variation
              </Button>

              <div className="border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowStructure(!showStructure)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold flex items-center justify-between hover:bg-white/5"
                >
                  View structure (SceneInput JSON)
                  <span className="text-white/40">{showStructure ? '\u25BE' : '\u25B8'}</span>
                </button>
                {showStructure && (
                  <pre className="px-4 pb-4 font-mono text-[10px] text-white/60 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                    {JSON.stringify(fullInput, null, 2)}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="bg-surface border border-dashed border-white/10 rounded-lg p-8 text-center text-sm text-white/40">
              {canCompose
                ? 'Click Compose Scene to generate the prompt.'
                : 'Add at least one character to compose a scene.'}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
