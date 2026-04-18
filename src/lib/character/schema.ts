import { z } from "zod";

export const CharacterSheetSchema = z.object({
  anchor_tag: z.string(),
  character_summary: z.string(),
  face: z.object({
    shape: z.string(),
    proportions: z.string(),
    jawline: z.string(),
    cheekbones: z.string(),
    forehead: z.string(),
    chin: z.string(),
  }),
  eyes: z.object({
    shape: z.string(),
    size: z.string(),
    iris_color_hex: z.string(),
    iris_color_name: z.string(),
    iris_style: z.string(),
    pupil: z.string(),
    eyelashes: z.string(),
    eyebrows: z.string(),
    eye_spacing: z.string(),
  }),
  nose: z.object({
    size: z.string(),
    shape: z.string(),
    bridge: z.string(),
    rendering: z.string(),
  }),
  mouth: z.object({
    lip_shape: z.string(),
    lip_size: z.string(),
    default_expression: z.string(),
  }),
  hair: z.object({
    base_color_hex: z.string(),
    base_color_name: z.string(),
    highlights: z.string(),
    length: z.string(),
    overall_style: z.string(),
    bangs: z.string(),
    partline: z.string(),
    texture: z.string(),
    notable_locks: z.array(z.string()),
  }),
  skin: z.object({
    tone_hex: z.string(),
    tone_name: z.string(),
    undertone: z.string(),
    marks: z.array(z.string()),
    shading_style: z.string(),
  }),
  body: z.object({
    build: z.string(),
    height_impression: z.string(),
    proportions: z.string(),
    notable_features: z.array(z.string()),
  }),
  clothing: z.array(
    z.object({
      layer: z.string(),
      item: z.string(),
      color_hex: z.string(),
      color_name: z.string(),
      fabric: z.string(),
      fit: z.string(),
      details: z.array(z.string()),
    })
  ),
  accessories: z.array(
    z.object({
      item: z.string(),
      placement: z.string(),
      color_hex: z.string(),
      material: z.string(),
      details: z.string(),
    })
  ),
  distinguishing_features: z.array(z.string()),
  art_style: z.object({
    overall: z.string(),
    line_weight: z.string(),
    shading: z.string(),
    screentone_usage: z.string(),
    reference_artists: z.array(z.string()),
    color_palette_mood: z.string(),
  }),
  default_pose_expression: z.string(),
  negative_prompt_elements: z.array(z.string()),
  master_prompt: z.string(),
});
