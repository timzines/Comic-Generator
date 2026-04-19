import { CharacterSheet } from "./types";

export function buildMasterPrompt(sheet: CharacterSheet): string {
  const paragraphs: string[] = [];

  // 1. Opening identity sentence
  paragraphs.push(
    `${sheet.anchor_tag} is a ${sheet.body.build} character with a ${sheet.body.height_impression} stature. ${sheet.anchor_tag} ${sheet.character_summary} Their proportions are ${sheet.body.proportions}${sheet.body.notable_features.length > 0 ? "; notable physical features include " + sheet.body.notable_features.join(", ") : ""}.`
  );

  // 2. Head & face paragraph
  paragraphs.push(
    `${sheet.anchor_tag} has a ${sheet.face.shape} face shape with ${sheet.face.proportions} proportions and a ${sheet.face.jawline} jawline. Their cheekbones are ${sheet.face.cheekbones}, set beneath a ${sheet.face.forehead} forehead, tapering to a ${sheet.face.chin} chin. Their eyes are ${sheet.eyes.shape} and ${sheet.eyes.size}, with ${sheet.eyes.iris_color_name} (${sheet.eyes.iris_color_hex}) irises rendered in a ${sheet.eyes.iris_style} style; the pupils are ${sheet.eyes.pupil}. Framing the eyes are ${sheet.eyes.eyelashes} eyelashes and ${sheet.eyes.eyebrows} eyebrows, spaced ${sheet.eyes.eye_spacing} apart. The nose is ${sheet.nose.size} and ${sheet.nose.shape} with a ${sheet.nose.bridge} bridge, rendered with ${sheet.nose.rendering}. The mouth features ${sheet.mouth.lip_size} ${sheet.mouth.lip_shape} lips, resting in a ${sheet.mouth.default_expression} expression.`
  );

  // 3. Hair paragraph
  const hairSection = `Their hair is ${sheet.hair.base_color_name} (${sheet.hair.base_color_hex})${sheet.hair.highlights ? " with " + sheet.hair.highlights + " highlights" : ""}, falling to ${sheet.hair.length} length in a ${sheet.hair.overall_style} style. The bangs are ${sheet.hair.bangs} with a ${sheet.hair.partline} partline; the texture is ${sheet.hair.texture}.${sheet.hair.notable_locks.length > 0 ? " Notable locks include " + sheet.hair.notable_locks.join("; ") + "." : ""}`;
  paragraphs.push(hairSection);

  // 4. Skin & distinguishing features
  let skinSection = `Their skin tone is ${sheet.skin.tone_name} (${sheet.skin.tone_hex}) with ${sheet.skin.undertone} undertones, shaded in a ${sheet.skin.shading_style} style.`;
  if (sheet.skin.marks.length > 0) {
    skinSection += ` Visible marks include ${sheet.skin.marks.join("; ")}.`;
  }
  if (sheet.distinguishing_features.length > 0) {
    skinSection += ` Distinguishing features: ${sheet.distinguishing_features.join("; ")}.`;
  }
  paragraphs.push(skinSection);

  // 5. Outfit paragraph
  if (sheet.clothing.length > 0) {
    const clothingDescriptions = sheet.clothing.map((item) => {
      let desc = `${item.fit} ${item.item} in ${item.color_name} (${item.color_hex}), made of ${item.fabric}`;
      if (item.details.length > 0) {
        desc += `, featuring ${item.details.join("; ")}`;
      }
      return desc;
    });
    paragraphs.push(
      `For clothing, ${sheet.anchor_tag} wears the following layers: ${clothingDescriptions.join(". Next, a ")}.`
    );
  }

  // 6. Accessories
  if (sheet.accessories.length > 0) {
    const accessoryDescriptions = sheet.accessories.map(
      (acc) =>
        `a ${acc.material} ${acc.item} (${acc.color_hex}) worn ${acc.placement}${acc.details ? "; " + acc.details : ""}`
    );
    paragraphs.push(
      `Accessories include ${accessoryDescriptions.join(", and ")}.`
    );
  }

  // 7. Art style
  paragraphs.push(
    `The art style is ${sheet.art_style.overall} with ${sheet.art_style.line_weight} line weight and ${sheet.art_style.shading} shading. Screentone usage is ${sheet.art_style.screentone_usage}.${sheet.art_style.reference_artists.length > 0 ? " Stylistic influences draw from " + sheet.art_style.reference_artists.join(", ") + "." : ""} The overall color palette mood is ${sheet.art_style.color_palette_mood}.`
  );

  // 8. Framing (hard-locked character reference card format)
  paragraphs.push(
    `Framing: waist-up composition, character standing in a relaxed natural neutral pose, arms at sides or loosely relaxed, facing slightly toward the camera with a calm neutral expression. Plain pure white background (#FFFFFF), flat and seamless with no environment, props, or scenery. Even soft studio lighting with no cast shadow on the backdrop. This is a character reference card — render the character only, isolated against white.`
  );

  // 9. Consistency trigger
  paragraphs.push(
    "Maintain 1:1 character and art style consistency across all generations. The face, eyes, hair, skin, body proportions, outfit, and art style must remain identical every time; only minor natural variation in the relaxed standing pose is acceptable."
  );

  // 10. Negative line (always include framing negatives)
  const framingNegatives = [
    "any background other than pure white",
    "environment or scenery",
    "props or held objects not listed",
    "full-body or close-up framing",
    "dynamic action poses",
    "exaggerated expressions",
    "cast shadows on the backdrop",
  ];
  const allNegatives = [...framingNegatives, ...sheet.negative_prompt_elements];
  paragraphs.push(`Avoid: ${allNegatives.join(", ")}.`);

  return paragraphs.join("\n\n");
}
