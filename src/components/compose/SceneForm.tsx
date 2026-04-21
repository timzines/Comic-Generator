'use client';
import {
  ASPECT_RATIOS,
  CAMERA_ANGLES,
  SHOT_TYPES,
  type AspectRatio,
  type CameraAngle,
  type SceneInput,
  type ShotType,
} from '@/lib/scene/schema';
import { SCENE_PRESETS, type ScenePreset } from '@/lib/scene/presets';

interface Props {
  value: Omit<SceneInput, 'characters'>;
  onChange: (next: Omit<SceneInput, 'characters'>) => void;
  multiCharacter: boolean;
}

const TIME_OF_DAY = [
  'dawn',
  'early morning',
  'morning',
  'noon',
  'afternoon',
  'golden hour',
  'dusk',
  'twilight',
  'night',
  'midnight',
];
const WEATHER = ['', 'clear', 'overcast', 'light rain', 'heavy rain', 'snow', 'fog', 'storm', 'mist', 'windy'];

export function SceneForm({ value, onChange, multiCharacter }: Props) {
  const set = <K extends keyof SceneInput>(key: K, v: Omit<SceneInput, 'characters'>[Extract<K, keyof Omit<SceneInput, 'characters'>>]) => {
    onChange({ ...value, [key]: v });
  };

  function applyPreset(preset: ScenePreset) {
    onChange({
      ...value,
      camera: preset.camera,
      lighting: preset.lighting,
      mood: preset.mood,
    });
  }

  function updateEnvChip(idx: number, text: string) {
    const next = [...value.setting.environment_details];
    next[idx] = text;
    set('setting', { ...value.setting, environment_details: next });
  }
  function addEnvChip() {
    set('setting', { ...value.setting, environment_details: [...value.setting.environment_details, ''] });
  }
  function removeEnvChip(idx: number) {
    set('setting', {
      ...value.setting,
      environment_details: value.setting.environment_details.filter((_, i) => i !== idx),
    });
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <div className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
          Scene Presets
        </div>
        <div className="flex gap-2 flex-wrap">
          {SCENE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent/40 transition"
              title={p.description}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Setting */}
      <details open className="bg-surface border border-white/10 rounded-lg">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-sm select-none">
          Setting
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <label className="block text-xs text-white/50">
            Location
            <input
              value={value.setting.location}
              onChange={(e) => set('setting', { ...value.setting, location: e.target.value })}
              placeholder="rooftop of a ruined pagoda, neon-lit ramen shop..."
              className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-white/50">
              Time of day
              <input
                list="tod-list"
                value={value.setting.time_of_day}
                onChange={(e) => set('setting', { ...value.setting, time_of_day: e.target.value })}
                placeholder="dusk"
                className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30"
              />
              <datalist id="tod-list">
                {TIME_OF_DAY.map((t) => <option key={t} value={t} />)}
              </datalist>
            </label>
            <label className="block text-xs text-white/50">
              Weather
              <select
                value={value.setting.weather ?? ''}
                onChange={(e) => set('setting', { ...value.setting, weather: e.target.value || undefined })}
                className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white"
              >
                {WEATHER.map((w) => (
                  <option key={w} value={w}>{w || '— none —'}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <div className="text-xs text-white/50 mb-2">Environment details</div>
            <div className="space-y-2">
              {value.setting.environment_details.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={d}
                    onChange={(e) => updateEnvChip(i, e.target.value)}
                    placeholder="scattered cherry blossoms on tile, distant city lights..."
                    className="flex-1 bg-bg border border-white/10 rounded-md px-3 py-1.5 text-sm text-white placeholder:text-white/30"
                  />
                  <button
                    onClick={() => removeEnvChip(i)}
                    className="text-xs text-red-300/70 hover:text-red-300 px-2"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button
                onClick={addEnvChip}
                className="text-xs text-accent hover:underline"
              >
                + add detail
              </button>
            </div>
          </div>
        </div>
      </details>

      {/* Camera */}
      <details open className="bg-surface border border-white/10 rounded-lg">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-sm select-none">
          Camera
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-white/50">
              Shot type
              <select
                value={value.camera.shot_type}
                onChange={(e) => set('camera', { ...value.camera, shot_type: e.target.value as ShotType })}
                className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white"
              >
                {SHOT_TYPES.map((s) => (
                  <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-white/50">
              Angle
              <select
                value={value.camera.angle}
                onChange={(e) => set('camera', { ...value.camera, angle: e.target.value as CameraAngle })}
                className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white"
              >
                {CAMERA_ANGLES.map((a) => (
                  <option key={a} value={a}>{a.replace(/-/g, ' ')}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs text-white/50">
            Lens feel (optional)
            <input
              value={value.camera.lens_feel ?? ''}
              onChange={(e) => set('camera', { ...value.camera, lens_feel: e.target.value || undefined })}
              placeholder="35mm wide feel, 85mm portrait compression..."
              className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </label>
          <label className="block text-xs text-white/50">
            Framing notes (optional)
            <input
              value={value.camera.framing ?? ''}
              onChange={(e) => set('camera', { ...value.camera, framing: e.target.value || undefined })}
              placeholder="rule of thirds, character on left third..."
              className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </label>
          <label className="block text-xs text-white/50">
            Aspect ratio
            <select
              value={value.aspect_ratio}
              onChange={(e) => set('aspect_ratio', e.target.value as AspectRatio)}
              className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white"
            >
              {ASPECT_RATIOS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
      </details>

      {/* Lighting & Mood */}
      <details open className="bg-surface border border-white/10 rounded-lg">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-sm select-none">
          Lighting &amp; Mood
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <label className="block text-xs text-white/50">
            Key light
            <input
              value={value.lighting.key_light}
              onChange={(e) => set('lighting', { ...value.lighting, key_light: e.target.value })}
              placeholder="warm sunset from frame right..."
              className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </label>
          <label className="block text-xs text-white/50">
            Lighting mood
            <input
              value={value.lighting.mood}
              onChange={(e) => set('lighting', { ...value.lighting, mood: e.target.value })}
              placeholder="golden rim lighting, deep shadows..."
              className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </label>
          <label className="block text-xs text-white/50">
            Color temperature (optional)
            <input
              value={value.lighting.color_temperature ?? ''}
              onChange={(e) => set('lighting', { ...value.lighting, color_temperature: e.target.value || undefined })}
              placeholder="warm foreground, cool background..."
              className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </label>
          <label className="block text-xs text-white/50">
            Overall mood
            <input
              value={value.mood}
              onChange={(e) => set('mood', e.target.value)}
              placeholder="tense standoff, quiet melancholy..."
              className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </label>
        </div>
      </details>

      {/* Interaction (multi-character only) */}
      {multiCharacter && (
        <details open className="bg-surface border border-accent/20 rounded-lg">
          <summary className="cursor-pointer px-4 py-3 font-semibold text-sm select-none text-accent">
            Interaction (required for multi-character)
          </summary>
          <div className="px-4 pb-4">
            <label className="block text-xs text-white/50">
              How do they relate in this scene?
              <textarea
                value={value.interaction ?? ''}
                onChange={(e) => set('interaction', e.target.value || undefined)}
                placeholder="She holds a katana pointed at him; he raises an open palm in defense."
                rows={2}
                className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30"
              />
            </label>
          </div>
        </details>
      )}

      {/* Art style override */}
      <details className="bg-surface border border-white/10 rounded-lg">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-sm select-none">
          Art style override (optional)
        </summary>
        <div className="px-4 pb-4">
          <label className="block text-xs text-white/50">
            Override the character's base art style for this scene
            <input
              value={value.art_style_override ?? ''}
              onChange={(e) => set('art_style_override', e.target.value || undefined)}
              placeholder="watercolor wash variant of the usual cel-shading..."
              className="mt-1 w-full bg-bg border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </label>
        </div>
      </details>
    </div>
  );
}
