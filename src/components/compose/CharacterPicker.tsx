'use client';
import { useEffect, useState } from 'react';
import { loadLibrary, type SavedCharacter } from '@/lib/character/library';
import {
  FACING_OPTIONS,
  SCENE_POSITIONS,
  type Facing,
  type SceneCharacter,
  type ScenePosition,
} from '@/lib/scene/schema';

interface Props {
  selected: SceneCharacter[];
  onChange: (next: SceneCharacter[]) => void;
  max?: number;
}

const DEFAULT_POSITIONS: ScenePosition[] = ['center', 'left', 'right', 'background'];

export function CharacterPicker({ selected, onChange, max = 4 }: Props) {
  const [library, setLibrary] = useState<SavedCharacter[]>([]);

  useEffect(() => {
    setLibrary(loadLibrary());
  }, []);

  const isSelected = (id: string) => selected.some((s) => s.sheet.anchor_tag === id);

  function addCharacter(c: SavedCharacter) {
    if (selected.length >= max) return;
    if (isSelected(c.sheet.anchor_tag)) return;
    const defaultPos =
      DEFAULT_POSITIONS[selected.length] ?? ('center' as ScenePosition);
    onChange([
      ...selected,
      {
        sheet: c.sheet,
        position: defaultPos,
        action: '',
        expression: '',
        facing: selected.length === 0 ? 'camera' : 'each_other',
      },
    ]);
  }

  function removeAt(idx: number) {
    onChange(selected.filter((_, i) => i !== idx));
  }

  function updateAt(idx: number, patch: Partial<SceneCharacter>) {
    onChange(selected.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  if (library.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-white/10 rounded-lg p-8 text-center">
        <div className="text-white/60 text-sm mb-3">
          Your character library is empty.
        </div>
        <a
          href="/character-prompt"
          className="inline-block text-sm text-accent hover:underline"
        >
          Generate and save a character first &rarr;
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Library strip */}
      <div>
        <div className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
          Library ({library.length}) — click to add
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {library.map((c) => {
            const picked = isSelected(c.sheet.anchor_tag);
            const disabled = picked || selected.length >= max;
            return (
              <button
                key={c.id}
                onClick={() => addCharacter(c)}
                disabled={disabled}
                className={`shrink-0 w-28 rounded-lg overflow-hidden border transition text-left ${
                  picked
                    ? 'border-accent/60 opacity-60'
                    : 'border-white/10 hover:border-accent/40'
                } ${disabled && !picked ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.thumbnail} alt={c.name} className="w-full h-28 object-cover" />
                <div className="p-2">
                  <div className="text-xs font-semibold text-white/80 truncate">
                    {c.name}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">
                    {picked ? 'Added' : 'Click to add'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected characters */}
      {selected.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-white/50 uppercase tracking-wide">
            Scene Cast ({selected.length}/{max})
          </div>
          {selected.map((c, idx) => (
            <div
              key={`${c.sheet.anchor_tag}-${idx}`}
              className="bg-surface border border-white/10 rounded-lg p-3 flex gap-3"
            >
              <div className="shrink-0 w-16 h-16 rounded bg-accent/20 text-accent text-2xl font-extrabold flex items-center justify-center">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold truncate">{c.sheet.anchor_tag}</div>
                  <button
                    onClick={() => removeAt(idx)}
                    className="text-xs text-red-300/70 hover:text-red-300 shrink-0"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] text-white/50">
                    Position
                    <select
                      value={c.position}
                      onChange={(e) => updateAt(idx, { position: e.target.value as ScenePosition })}
                      className="mt-0.5 w-full bg-bg border border-white/10 rounded px-2 py-1 text-xs text-white"
                    >
                      {SCENE_POSITIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[11px] text-white/50">
                    Facing
                    <select
                      value={c.facing ?? 'camera'}
                      onChange={(e) => updateAt(idx, { facing: e.target.value as Facing })}
                      className="mt-0.5 w-full bg-bg border border-white/10 rounded px-2 py-1 text-xs text-white"
                    >
                      {FACING_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="text-[11px] text-white/50 block">
                  Action
                  <input
                    value={c.action}
                    onChange={(e) => updateAt(idx, { action: e.target.value })}
                    placeholder="drawing her sword, sipping tea, mid-laugh..."
                    className="mt-0.5 w-full bg-bg border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/30"
                  />
                </label>
                <label className="text-[11px] text-white/50 block">
                  Expression override (optional)
                  <input
                    value={c.expression ?? ''}
                    onChange={(e) => updateAt(idx, { expression: e.target.value })}
                    placeholder={c.sheet.default_pose_expression || 'neutral'}
                    className="mt-0.5 w-full bg-bg border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/30"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
