import type { CharacterSheet } from "@/lib/character/types";

export const BUDGET_FULL = Number.POSITIVE_INFINITY;
export const BUDGET_MEDIUM = 40;
export const BUDGET_SHORT = 25;
export const BUDGET_MINIMAL = 15;

export function budgetForCount(count: number): number {
  if (count <= 1) return BUDGET_FULL;
  if (count === 2) return BUDGET_MEDIUM;
  if (count === 3) return BUDGET_SHORT;
  return BUDGET_MINIMAL;
}

function wc(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function colorWithHex(name: string, hex: string): string {
  if (!name) return "";
  if (hex && hex.startsWith("#")) return `${name} (${hex})`;
  return name;
}

/**
 * Build a condensed in-scene description of a character, respecting a word budget.
 * Priority (filled in order, each piece added only if it fits):
 *  1. anchor_tag (always, even if it overflows)
 *  2. hair — the strongest silhouette cue
 *  3. eyes
 *  4. hero outfit piece
 *  5. face shape
 *  6. top distinguishing feature
 *  7. skin tone
 *  8. accessory
 *  9. secondary clothing
 */
export function condenseCharacter(
  sheet: CharacterSheet,
  wordBudget: number,
): string {
  const parts: string[] = [];

  const tryAdd = (s: string | null | undefined): void => {
    if (!s) return;
    const next = parts.length === 0 ? s : `${parts.join(", ")}, ${s}`;
    if (wc(next) <= wordBudget || !Number.isFinite(wordBudget)) {
      parts.push(s);
    }
  };

  // 1. Anchor — always pushed, even if it overflows (identity non-negotiable)
  parts.push(`the ${sheet.anchor_tag}`);

  // 2. Hair
  {
    const color = colorWithHex(sheet.hair.base_color_name, sheet.hair.base_color_hex);
    const hair = color
      ? `with ${color} ${sheet.hair.length} hair${sheet.hair.bangs ? ` and ${sheet.hair.bangs}` : ""}`
      : null;
    tryAdd(hair);
  }

  // 3. Eyes
  {
    const color = colorWithHex(sheet.eyes.iris_color_name, sheet.eyes.iris_color_hex);
    const eyes = color ? `${color} ${sheet.eyes.shape} eyes` : null;
    tryAdd(eyes);
  }

  // 4. Hero outfit piece
  const hero =
    sheet.clothing.find((c) => /outer|main|hero|jacket|coat|cloak|haori/i.test(c.layer)) ??
    sheet.clothing[0];
  if (hero) {
    const color = colorWithHex(hero.color_name, hero.color_hex);
    tryAdd(`wearing ${hero.fit} ${color} ${hero.item}`.replace(/\s+/g, " ").trim());
  }

  // 5. Face shape
  if (sheet.face.shape) tryAdd(`${sheet.face.shape} face`);

  // 6. Top distinguishing mark (scar, mole, signature feature)
  const topMark = sheet.skin.marks[0] ?? sheet.distinguishing_features[0];
  if (topMark) tryAdd(topMark);

  // 7. Skin
  if (sheet.skin.tone_name) {
    tryAdd(`${colorWithHex(sheet.skin.tone_name, sheet.skin.tone_hex)} skin`);
  }

  // 8. Accessory
  if (sheet.accessories.length > 0) {
    const acc = sheet.accessories[0];
    tryAdd(`${acc.material} ${acc.item} ${acc.placement}`.replace(/\s+/g, " ").trim());
  }

  // 9. Secondary clothing
  const secondary = sheet.clothing.find((c) => c !== hero);
  if (secondary) {
    tryAdd(`${colorWithHex(secondary.color_name, secondary.color_hex)} ${secondary.item}`.trim());
  }

  return parts.join(", ");
}
