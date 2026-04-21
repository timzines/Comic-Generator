import { z } from "zod";
import type { CharacterSheet } from "@/lib/character/types";

export const SCENE_POSITIONS = [
  "center",
  "left",
  "right",
  "foreground",
  "midground",
  "background",
  "left-foreground",
  "right-foreground",
  "left-background",
  "right-background",
] as const;

export const SHOT_TYPES = [
  "extreme-wide",
  "wide",
  "medium-wide",
  "medium",
  "medium-close",
  "close-up",
  "extreme-close-up",
] as const;

export const CAMERA_ANGLES = [
  "eye-level",
  "low-angle",
  "high-angle",
  "birds-eye",
  "worms-eye",
  "dutch-tilt",
  "over-shoulder",
] as const;

export const FACING_OPTIONS = [
  "camera",
  "left",
  "right",
  "away",
  "each_other",
] as const;

export const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;

export type ScenePosition = (typeof SCENE_POSITIONS)[number];
export type ShotType = (typeof SHOT_TYPES)[number];
export type CameraAngle = (typeof CAMERA_ANGLES)[number];
export type Facing = (typeof FACING_OPTIONS)[number];
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export interface SceneCharacter {
  sheet: CharacterSheet;
  position: ScenePosition;
  action: string;
  expression?: string;
  facing?: Facing;
}

export interface SceneInput {
  characters: SceneCharacter[];
  setting: {
    location: string;
    time_of_day: string;
    weather?: string;
    environment_details: string[];
  };
  camera: {
    shot_type: ShotType;
    angle: CameraAngle;
    lens_feel?: string;
    framing?: string;
  };
  lighting: {
    key_light: string;
    mood: string;
    color_temperature?: string;
  };
  mood: string;
  interaction?: string;
  art_style_override?: string;
  aspect_ratio: AspectRatio;
}

export const SceneCharacterSchema = z.object({
  sheet: z.custom<CharacterSheet>(),
  position: z.enum(SCENE_POSITIONS),
  action: z.string(),
  expression: z.string().optional(),
  facing: z.enum(FACING_OPTIONS).optional(),
});

export const SceneInputSchema = z.object({
  characters: z.array(SceneCharacterSchema).min(1).max(4),
  setting: z.object({
    location: z.string(),
    time_of_day: z.string(),
    weather: z.string().optional(),
    environment_details: z.array(z.string()),
  }),
  camera: z.object({
    shot_type: z.enum(SHOT_TYPES),
    angle: z.enum(CAMERA_ANGLES),
    lens_feel: z.string().optional(),
    framing: z.string().optional(),
  }),
  lighting: z.object({
    key_light: z.string(),
    mood: z.string(),
    color_temperature: z.string().optional(),
  }),
  mood: z.string(),
  interaction: z.string().optional(),
  art_style_override: z.string().optional(),
  aspect_ratio: z.enum(ASPECT_RATIOS),
});
