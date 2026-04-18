export interface CharacterSheet {
  anchor_tag: string;
  character_summary: string;
  face: {
    shape: string;
    proportions: string;
    jawline: string;
    cheekbones: string;
    forehead: string;
    chin: string;
  };
  eyes: {
    shape: string;
    size: string;
    iris_color_hex: string;
    iris_color_name: string;
    iris_style: string;
    pupil: string;
    eyelashes: string;
    eyebrows: string;
    eye_spacing: string;
  };
  nose: {
    size: string;
    shape: string;
    bridge: string;
    rendering: string;
  };
  mouth: {
    lip_shape: string;
    lip_size: string;
    default_expression: string;
  };
  hair: {
    base_color_hex: string;
    base_color_name: string;
    highlights: string;
    length: string;
    overall_style: string;
    bangs: string;
    partline: string;
    texture: string;
    notable_locks: string[];
  };
  skin: {
    tone_hex: string;
    tone_name: string;
    undertone: string;
    marks: string[];
    shading_style: string;
  };
  body: {
    build: string;
    height_impression: string;
    proportions: string;
    notable_features: string[];
  };
  clothing: Array<{
    layer: string;
    item: string;
    color_hex: string;
    color_name: string;
    fabric: string;
    fit: string;
    details: string[];
  }>;
  accessories: Array<{
    item: string;
    placement: string;
    color_hex: string;
    material: string;
    details: string;
  }>;
  distinguishing_features: string[];
  art_style: {
    overall: string;
    line_weight: string;
    shading: string;
    screentone_usage: string;
    reference_artists: string[];
    color_palette_mood: string;
  };
  default_pose_expression: string;
  negative_prompt_elements: string[];
  master_prompt: string;
}
