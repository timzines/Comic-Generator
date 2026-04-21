import type { CameraAngle, ShotType } from "./schema";

export interface ScenePreset {
  id: string;
  name: string;
  description: string;
  camera: { shot_type: ShotType; angle: CameraAngle; lens_feel?: string; framing?: string };
  lighting: { key_light: string; mood: string; color_temperature?: string };
  mood: string;
}

export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: "action-confrontation",
    name: "Action Confrontation",
    description: "Low-angle medium, tense standoff",
    camera: {
      shot_type: "medium-wide",
      angle: "low-angle",
      lens_feel: "35mm wide feel",
      framing: "rule of thirds, characters on opposing thirds",
    },
    lighting: {
      key_light: "hard directional light from frame right",
      mood: "deep contrasting shadows, dramatic rim",
      color_temperature: "cool shadows with warm highlight",
    },
    mood: "tense standoff",
  },
  {
    id: "quiet-moment",
    name: "Quiet Moment",
    description: "Close-up, soft light, introspective",
    camera: {
      shot_type: "close-up",
      angle: "eye-level",
      lens_feel: "85mm portrait compression",
      framing: "tight centered composition with soft background bokeh",
    },
    lighting: {
      key_light: "soft diffused window light from frame left",
      mood: "warm ambient glow, minimal shadow",
      color_temperature: "warm tungsten tones",
    },
    mood: "quiet melancholy",
  },
  {
    id: "establishing-shot",
    name: "Establishing Shot",
    description: "Wide, character in environment",
    camera: {
      shot_type: "wide",
      angle: "eye-level",
      lens_feel: "24mm wide-angle feel",
      framing: "character small in frame, landscape dominant",
    },
    lighting: {
      key_light: "natural ambient sunlight",
      mood: "expansive, atmospheric, depth-rich",
      color_temperature: "balanced daylight",
    },
    mood: "cinematic scope",
  },
  {
    id: "over-shoulder",
    name: "Over-the-Shoulder",
    description: "Two-character dialogue framing",
    camera: {
      shot_type: "medium",
      angle: "over-shoulder",
      lens_feel: "50mm natural feel",
      framing: "foreground shoulder soft, background character sharp",
    },
    lighting: {
      key_light: "soft key from frame right",
      mood: "natural conversational lighting",
    },
    mood: "charged conversation",
  },
  {
    id: "silhouette-reveal",
    name: "Silhouette Reveal",
    description: "Backlit dramatic reveal",
    camera: {
      shot_type: "medium-wide",
      angle: "low-angle",
      lens_feel: "35mm feel",
      framing: "character centered, strong backlight haloing silhouette",
    },
    lighting: {
      key_light: "strong backlight from behind character",
      mood: "high-contrast silhouette with glowing rim",
      color_temperature: "cool backlit, warm fill",
    },
    mood: "dramatic reveal",
  },
  {
    id: "dynamic-action",
    name: "Dynamic Action",
    description: "Dutch tilt, motion energy",
    camera: {
      shot_type: "medium",
      angle: "dutch-tilt",
      lens_feel: "28mm wide with slight distortion",
      framing: "diagonal composition, motion lines",
    },
    lighting: {
      key_light: "harsh key with motion streaks",
      mood: "kinetic energy, saturated",
    },
    mood: "explosive action",
  },
];

export function getPreset(id: string): ScenePreset | undefined {
  return SCENE_PRESETS.find((p) => p.id === id);
}
