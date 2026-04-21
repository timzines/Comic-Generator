import type { CharacterSheet } from "@/lib/character/types";
import type { SceneCharacter, SceneInput, ScenePosition } from "./schema";
import { budgetForCount, condenseCharacter } from "./condenser";

function positionPhrase(pos: ScenePosition): string {
  switch (pos) {
    case "center":
      return "At center frame";
    case "left":
      return "On the left";
    case "right":
      return "On the right";
    case "foreground":
      return "In the foreground";
    case "midground":
      return "In the midground";
    case "background":
      return "In the background";
    case "left-foreground":
      return "In the left foreground";
    case "right-foreground":
      return "In the right foreground";
    case "left-background":
      return "In the left background";
    case "right-background":
      return "In the right background";
  }
}

function facingPhrase(char: SceneCharacter): string | null {
  if (!char.facing) return null;
  switch (char.facing) {
    case "camera":
      return "facing the camera";
    case "left":
      return "facing left";
    case "right":
      return "facing right";
    case "away":
      return "facing away from the camera";
    case "each_other":
      return "turned toward the other character";
  }
}

function buildOpeningSentence(input: SceneInput): string {
  const bits: string[] = [];
  if (input.mood) bits.push(input.mood);
  const where = input.setting.location?.trim();
  const when = input.setting.time_of_day?.trim();
  const weather = input.setting.weather?.trim();

  let loc = "";
  if (where && when) loc = `on ${where} at ${when}`;
  else if (where) loc = `on ${where}`;
  else if (when) loc = `at ${when}`;

  const lead = bits.length > 0 ? `A ${bits.join(", ")}` : "A scene";
  const opening = loc ? `${lead} ${loc}` : lead;
  return weather ? `${opening}, ${weather}.` : `${opening}.`;
}

function buildCharacterBlock(
  char: SceneCharacter,
  condensed: string,
  isSingle: boolean,
): string {
  const pos = positionPhrase(char.position);
  const facing = facingPhrase(char);
  const action = char.action?.trim();
  const expression = char.expression?.trim();

  if (isSingle) {
    // Full master_prompt + action framing. Position still declared.
    const frame = [
      `${pos}, ${condensed}.`,
      action ? `They are ${action}.` : null,
      facing ? `They are ${facing}.` : null,
      expression ? `Their expression: ${expression}.` : null,
    ]
      .filter(Boolean)
      .join(" ");
    return frame;
  }

  const verbPieces: string[] = [];
  if (action) verbPieces.push(action);
  if (facing) verbPieces.push(facing);
  if (expression) verbPieces.push(`with a ${expression} expression`);

  const verbClause = verbPieces.length > 0 ? `, ${verbPieces.join(", ")}` : "";
  return `${pos}, ${condensed}${verbClause}.`;
}

function buildCameraSentence(input: SceneInput): string {
  const pieces: string[] = [];
  pieces.push(
    `Captured in a ${input.camera.shot_type.replace(/-/g, " ")} shot from a ${input.camera.angle.replace(/-/g, " ")}`,
  );
  if (input.camera.lens_feel) pieces.push(input.camera.lens_feel);
  if (input.camera.framing) pieces.push(input.camera.framing);
  return `${pieces.join(", ")}.`;
}

function buildLightingSentence(input: SceneInput): string {
  const parts = [input.lighting.key_light, input.lighting.mood].filter(
    (s) => s && s.trim(),
  );
  const sentence = parts.join(", ");
  const temp = input.lighting.color_temperature?.trim();
  const core = sentence ? `Lighting: ${sentence}` : "";
  const withTemp = temp ? (core ? `${core}, ${temp}` : `Lighting: ${temp}`) : core;
  return withTemp ? `${withTemp}.` : "";
}

function buildEnvironmentSentence(input: SceneInput): string {
  const details = input.setting.environment_details.filter((d) => d && d.trim());
  if (details.length === 0) return "";
  return `${details.join("; ")}.`;
}

function mergeArtStyle(sheets: CharacterSheet[], override?: string): string {
  if (override && override.trim()) {
    return `Art style: ${override.trim()}.`;
  }
  const primary = sheets[0]?.art_style;
  if (!primary) return "";
  const refs =
    primary.reference_artists.length > 0
      ? ` Stylistic influences: ${primary.reference_artists.join(", ")}.`
      : "";
  return `Rendered in ${primary.overall} — ${primary.line_weight} linework, ${primary.shading} shading, ${primary.screentone_usage} screentone, ${primary.color_palette_mood} palette.${refs}`;
}

function mergeNegatives(sheets: CharacterSheet[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sheets) {
    for (const n of s.negative_prompt_elements) {
      const key = n.toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push(n);
      }
    }
  }
  return out;
}

export function assembleScenePrompt(input: SceneInput): string {
  const count = input.characters.length;
  const budget = budgetForCount(count);
  const isSingle = count === 1;

  const paragraphs: string[] = [];
  paragraphs.push(buildOpeningSentence(input));

  const sheets = input.characters.map((c) => c.sheet);
  const condensedByChar = input.characters.map((c) =>
    isSingle ? c.sheet.master_prompt : condenseCharacter(c.sheet, budget),
  );

  input.characters.forEach((char, i) => {
    paragraphs.push(buildCharacterBlock(char, condensedByChar[i], isSingle));
  });

  if (count >= 2 && input.interaction && input.interaction.trim()) {
    paragraphs.push(input.interaction.trim());
  }

  const cam = buildCameraSentence(input);
  if (cam) paragraphs.push(cam);

  const light = buildLightingSentence(input);
  if (light) paragraphs.push(light);

  const env = buildEnvironmentSentence(input);
  if (env) paragraphs.push(env);

  const style = mergeArtStyle(sheets, input.art_style_override);
  if (style) paragraphs.push(style);

  paragraphs.push(
    "Aspect ratio: " + input.aspect_ratio + ".",
  );

  paragraphs.push(
    "Maintain character consistency across all generations; preserve each character's distinctive features exactly as described.",
  );

  const negatives = mergeNegatives(sheets);
  if (negatives.length > 0) {
    paragraphs.push(`Avoid: ${negatives.join(", ")}.`);
  }

  return paragraphs.join("\n\n");
}
