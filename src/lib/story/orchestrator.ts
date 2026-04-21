import { z } from 'zod';
import { grokChat, stripJsonFences } from '@/lib/grok';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { OptionsSchema, ScoreSchema } from '@/lib/schemas/story';
import { getArchetype, YONKOMA_SYSTEM_PROMPT, type ArchetypeKey } from './archetypes';
import type { ResearchResponse, StoryOptionData, ScoreResponse } from '@/types/api';
import type { ActBreakdown, PageStructure } from '@/types/database';

const PanelSchema = z.object({
  panelIndex: z.number().int().min(0),
  pageNumber: z.number().int().min(1),
  positionInPage: z.number().int().min(0),
  prompt: z.string(),
  dialog: z.string().nullable(),
});
const PanelsSchema = z.array(PanelSchema).min(1).max(50);

export interface OrchestratedPanel {
  id: string;
  panelIndex: number;
  pageNumber: number;
  positionInPage: number;
  prompt: string;
  dialog: string | null;
}

export async function researchForDescription(description: string): Promise<ResearchResponse> {
  const result = await grokChat([
    {
      role: 'system',
      content:
        'You are a creative director for a manga studio. You research visual and narrative inspiration for manga comics. Always respond with valid JSON only, no markdown.',
    },
    {
      role: 'user',
      content: `Search the internet for inspiration for a manga comic. The concept is: ${description}. Return a JSON object with two fields: "inspirations" (array of 5 strings, each a specific reference work or real-world source with brief explanation) and "themes" (array of 3 thematic angles to explore).`,
    },
  ]);
  return JSON.parse(stripJsonFences(result.content)) as ResearchResponse;
}

export interface GenerateOptionsParams {
  comicId: string;
  title: string;
  description: string;
  research: ResearchResponse;
  archetype?: ArchetypeKey;
}

export async function generateStoryOptions(params: GenerateOptionsParams): Promise<StoryOptionData[]> {
  const { comicId, title, description, research, archetype: archetypeKey } = params;
  const archetype = getArchetype(archetypeKey);

  const systemContent = archetype
    ? YONKOMA_SYSTEM_PROMPT
    : 'You are a master manga writer and page layout director. You write compelling, visually-rich story structures with detailed page-by-page breakdowns. Respond ONLY with a valid JSON array. No markdown, no explanation, no preamble.';

  const userContent = archetype
    ? `Write exactly 3 distinct 4-panel yonkoma strips for a manga comic titled "${title}".

Concept: ${description}

Inspiration research: ${JSON.stringify(research.inspirations)}
Themes to explore: ${research.themes.join(', ')}

ARCHETYPE: ${archetype.name} — ${archetype.summary}
${archetype.structurePrompt}

TWIST RULE: ${archetype.twistRule}
REFERENCE: ${archetype.referenceWorks}

Each of the 3 options must:
- Be a complete 4-panel strip on a single page (pageNumber 1, panelCount 4)
- Use exactly 4 panels in the Ki-Shō-Ten-Ketsu structure described above
- Stay within the archetype's tone — do not drift
- Reuse the same 1–2 named characters across all 4 panels (give them concrete names and a consistent concrete detail like clothing, pet, or setting)
- Keep dialog under 40 words total across all 4 panels
- Make the twist specific and earned, not generic

Return a JSON array of exactly 3 objects, each with:
- title: string (punchy strip title, not a summary)
- logline: string (one-sentence hook including the twist)
- actBreakdown: array of 4 objects, each with 'act' (string: 'Panel 1 / Ki', 'Panel 2 / Shō', 'Panel 3 / Ten', 'Panel 4 / Ketsu') and 'desc' (string: 1-2 sentence beat description)
- estimatedPanels: number (MUST be 4)
- estimatedPages: number (MUST be 1)
- pageStructure: array of 1 page object with pageNumber: 1, panelCount: 4, and panels: array of 4 panel objects, each with:
  - position: number (0, 1, 2, 3)
  - description: string (vivid panel image description — framing, composition, expression, concrete visual detail)
  - dialog: string or null (≤15 words per panel; null for silent panels, which are strong for Panel 4)
- tone: string (2-3 words matching the archetype tone)

Make the 3 options meaningfully different — different scenario, different twist, different named characters. All 3 must strictly obey the archetype's twist rule.`
    : `Write exactly 3 distinct story options for a manga comic titled "${title}".

Concept: ${description}

Inspiration research: ${JSON.stringify(research.inspirations)}
Themes to explore: ${research.themes.join(', ')}

Return a JSON array of exactly 3 objects, each with:
- title: string (compelling story title)
- logline: string (one punchy sentence describing the story)
- actBreakdown: array of exactly 3 objects, each with 'act' (string: 'Act 1', 'Act 2', 'Act 3') and 'desc' (string: 2 sentence description of what happens)
- estimatedPanels: number (total panel count across all pages)
- estimatedPages: number (between 3 and 8)
- pageStructure: array of page objects, one per page. Each page has:
  - pageNumber: number (1-based)
  - panelCount: number (3-5 panels per page)
  - panels: array of panel objects, each with:
    - position: number (0-based index within the page)
    - description: string (vivid manga scene description — action, framing, emotion)
    - dialog: string or null (character speech/thought bubble text, null if no dialog)
- tone: string (2-3 words describing the emotional tone)

Think like a manga editor: pace reveals across pages, use splash panels for dramatic moments, and write dialog that sounds natural. The total panels across all pages must equal estimatedPanels.`;

  const result = await grokChat([
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ]);

  const parsed = OptionsSchema.parse(JSON.parse(stripJsonFences(result.content)));

  await supabaseAdmin.from('story_options').delete().eq('comic_id', comicId);
  const rows = parsed.map((o, i) => ({
    comic_id: comicId,
    option_index: i,
    title: o.title,
    logline: o.logline,
    act_breakdown: o.actBreakdown,
    estimated_panels: o.estimatedPanels,
    estimated_pages: o.estimatedPages,
    page_structure: o.pageStructure,
    tone: o.tone,
    selected: false,
  }));
  const { error: insertErr } = await supabaseAdmin.from('story_options').insert(rows);
  if (insertErr) throw new Error(`options_insert_failed: ${insertErr.message}`);

  return parsed;
}

export interface ScoreOptionParams {
  option: StoryOptionData;
  archetype?: ArchetypeKey;
}

export async function scoreStoryOption(params: ScoreOptionParams): Promise<ScoreResponse> {
  const { option, archetype: archetypeKey } = params;
  const archetype = getArchetype(archetypeKey);

  const archetypeSection = archetype
    ? `ARCHETYPE: ${archetype.name}. TWIST RULE: ${archetype.twistRule}. Score penalties if the strip drifts from tone or fails the twist rule.`
    : 'No specific archetype constraint — rate purely on viral/shareability heuristics.';

  const result = await grokChat([
    {
      role: 'system',
      content:
        'You are a harsh viral-comic editor. You rate comic strip drafts on a 0-10 scale for shareability, with specific deductions for generic output, soft landings, and tonal drift. Respond ONLY with valid JSON of shape {"score": number, "rationale": string}. No markdown.',
    },
    {
      role: 'user',
      content: `Rate this manga strip draft for viral potential.

${archetypeSection}

Title: ${option.title}
Logline: ${option.logline}
Tone: ${option.tone}

Beats:
${option.actBreakdown.map((a) => `- ${a.act}: ${a.desc}`).join('\n')}

Panels:
${option.pageStructure
  .flatMap((p) => p.panels)
  .map((p, i) => `  Panel ${i + 1}: ${p.description}${p.dialog ? ` — "${p.dialog}"` : ''}`)
  .join('\n')}

Scoring rubric (harsh):
- 8-10: Specific named characters, earned twist, locked tone, sub-40-word dialog, panel 4 lands without explaining. Would get shared.
- 5-7: Decent premise but generic execution, weak twist, or soft ending. Mid.
- 0-4: Generic characters, moral/resolution ending, tone drift, over-written dialog, no real turn. Would get scrolled past.

Return ONLY: {"score": <0-10>, "rationale": "<one or two short sentences on the single biggest weakness>"}`,
    },
  ]);

  return ScoreSchema.parse(JSON.parse(stripJsonFences(result.content)));
}

export interface SelectOptionParams {
  comicId: string;
  optionIndex: number;
  archetype?: ArchetypeKey;
}

export async function selectStoryOption(params: SelectOptionParams): Promise<{ characterBible: string }> {
  const { comicId, optionIndex, archetype } = params;

  const { data: option } = await supabaseAdmin
    .from('story_options')
    .select('*')
    .eq('comic_id', comicId)
    .eq('option_index', optionIndex)
    .single();

  if (!option) throw new Error('option_not_found');

  const acts = (option.act_breakdown as ActBreakdown[] | null) ?? [];
  const actSummary = acts.map((a) => `${a.act}: ${a.desc}`).join(' | ');

  const result = await grokChat([
    {
      role: 'system',
      content: 'You are a comic book character designer. Respond only with a single paragraph of plain text.',
    },
    {
      role: 'user',
      content: `Based on this story: "${option.logline}" with these acts: ${actSummary}, write a CHARACTER BIBLE — a single dense paragraph that precisely describes the visual appearance of every named character. Include: hair color and style, eye color, clothing, distinguishing features, body type. Be extremely specific so an AI image generator can maintain consistency across 10+ panels. Focus only on visual appearance, not personality.`,
    },
  ]);

  const characterBible = result.content.trim();
  const pageCount = (option.estimated_pages as number | null) ?? 1;

  const update: Record<string, unknown> = {
    character_bible: characterBible,
    status: 'generating',
    page_count: pageCount,
  };
  if (archetype) update.archetype = archetype;

  await supabaseAdmin.from('comics').update(update).eq('id', comicId);
  await supabaseAdmin.from('story_options').update({ selected: false }).eq('comic_id', comicId);
  await supabaseAdmin.from('story_options').update({ selected: true }).eq('id', option.id);

  return { characterBible };
}

export interface GeneratePanelsParams {
  comicId: string;
  archetype?: ArchetypeKey;
}

export async function generatePanelPrompts(params: GeneratePanelsParams): Promise<OrchestratedPanel[]> {
  const { comicId, archetype: archetypeKey } = params;

  const { data: comic } = await supabaseAdmin
    .from('comics')
    .select('character_bible, style, archetype')
    .eq('id', comicId)
    .single();

  const { data: option } = await supabaseAdmin
    .from('story_options')
    .select('*')
    .eq('comic_id', comicId)
    .eq('selected', true)
    .single();

  if (!comic || !option) throw new Error('missing_context');

  const effectiveArchetypeKey = archetypeKey ?? (comic.archetype as ArchetypeKey | null) ?? undefined;
  const archetype = getArchetype(effectiveArchetypeKey);

  const acts = (option.act_breakdown as ActBreakdown[] | null) ?? [];
  const actText = acts.map((a) => `${a.act}: ${a.desc}`).join('\n');

  const pageStructure = (option.page_structure as PageStructure[] | null) ?? [];
  const pageStructureText = pageStructure
    .map(
      (page) =>
        `Page ${page.pageNumber} (${page.panelCount} panels):\n${page.panels
          .map(
            (panel) =>
              `  Panel ${panel.position}: ${panel.description}${panel.dialog ? ` — Dialog: "${panel.dialog}"` : ''}`,
          )
          .join('\n')}`,
    )
    .join('\n\n');

  const totalPanels = pageStructure.reduce((sum, page) => sum + page.panels.length, 0);

  const archetypeSection = archetype
    ? `\nARCHETYPE: ${archetype.name} — ${archetype.summary}\nTWIST RULE: ${archetype.twistRule}\nKeep the archetype's tone in every panel description. The final panel must land the archetype's beat, not soften it.\n`
    : '';

  const result = await grokChat([
    {
      role: 'system',
      content:
        'You are a manga panel director. You write precise image generation prompts for each panel, respecting the page layout. Respond ONLY with a valid JSON array.',
    },
    {
      role: 'user',
      content: `Write individual image generation prompts for every panel of this manga comic.

Story: ${option.logline}
Character bible: ${comic.character_bible}
Art style: Manga (ink-heavy, screentones, dynamic compositions)
${archetypeSection}
Act breakdown:
${actText}

Page structure:
${pageStructureText}

Generate exactly ${totalPanels || option.estimated_panels} panel prompts, one for each panel in the page structure above.

Return a JSON array of objects, each with:
- panelIndex: number (0-based, sequential across all pages)
- pageNumber: number (1-based, which page this panel belongs to)
- positionInPage: number (0-based, position within the page)
- prompt: string (detailed image generation prompt that includes: the exact scene action, camera angle, lighting, the character's appearance matching the character bible exactly, manga art style descriptor, mood)
- dialog: string or null (character speech/thought bubble text from the page structure, null if no dialog)

IMPORTANT: Every single prompt must include the character's physical description from the character bible verbatim. This ensures consistency across all panels.`,
    },
  ]);

  const parsed = PanelsSchema.parse(JSON.parse(stripJsonFences(result.content)));

  await supabaseAdmin.from('panels').delete().eq('comic_id', comicId);
  const rows = parsed.map((p) => ({
    comic_id: comicId,
    panel_index: p.panelIndex,
    page_number: p.pageNumber,
    position_in_page: p.positionInPage,
    prompt: p.prompt,
    dialog: p.dialog,
    status: 'pending' as const,
  }));
  const { data: inserted } = await supabaseAdmin
    .from('panels')
    .insert(rows)
    .select('id, panel_index, page_number, position_in_page, prompt, dialog');

  const pageCount = pageStructure.length || (option.estimated_pages as number | null) || 1;
  await supabaseAdmin
    .from('comics')
    .update({ panel_count: parsed.length, page_count: pageCount })
    .eq('id', comicId);

  return (inserted ?? []).map((p) => ({
    id: p.id,
    panelIndex: p.panel_index,
    pageNumber: p.page_number,
    positionInPage: p.position_in_page,
    prompt: p.prompt ?? '',
    dialog: p.dialog ?? null,
  }));
}

export function pickBestOption(
  options: StoryOptionData[],
  scores: ScoreResponse[],
): { optionIndex: number; score: number; rationale: string } {
  if (options.length === 0) throw new Error('no_options');
  let bestIndex = 0;
  let bestScore = scores[0]?.score ?? -1;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i].score > bestScore) {
      bestScore = scores[i].score;
      bestIndex = i;
    }
  }
  return {
    optionIndex: bestIndex,
    score: bestScore,
    rationale: scores[bestIndex]?.rationale ?? '',
  };
}
