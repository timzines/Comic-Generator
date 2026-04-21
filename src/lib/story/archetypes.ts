export type ArchetypeKey = 'dark-surreal' | 'oh-no' | 'technical-reframe' | 'wholesome-twist';

export interface Archetype {
  key: ArchetypeKey;
  name: string;
  summary: string;
  structurePrompt: string;
  twistRule: string;
  referenceWorks: string;
}

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  'dark-surreal': {
    key: 'dark-surreal',
    name: 'Dark surreal',
    summary: 'Mundane domestic setting escalates into absurd/horror territory while characters stay resigned or deadpan.',
    structurePrompt: [
      'Tone: deadpan dark humor. Surface-normal characters, wrongness building underneath.',
      'Panel 1 (Ki): Utterly mundane domestic/office/commute moment. One hyper-specific concrete detail.',
      'Panel 2 (Shō): Minor off-note. Something is subtly wrong but not acknowledged. Build tension.',
      'Panel 3 (Ten): The wrongness reveals itself — escalate to absurd or horror. Recontextualize the first two panels.',
      'Panel 4 (Ketsu): Character reacts with resignation or deadpan acceptance. No resolution, no moral. Let it hang.',
    ].join('\n'),
    twistRule: 'The turn must recontextualize panel 1 or 2, not merely add conflict. No character explains the joke.',
    referenceWorks: 'War and Peas, Poorly Drawn Lines, The Perry Bible Fellowship.',
  },
  'oh-no': {
    key: 'oh-no',
    name: 'Oh no',
    summary: 'Short, punchy: expectation → reveal → dread. The character realizes things are bad.',
    structurePrompt: [
      'Tone: anxious/relatable. Very short panels, minimal art detail, high scroll legibility.',
      'Panel 1 (Setup): Character expects something good / acts on an assumption.',
      'Panel 2 (Hint): Something begins to subvert the expectation. Small visual cue of dread.',
      'Panel 3 (Reveal): The reality is worse than expected. Character pauses.',
      'Panel 4 (Oh no): Character\'s face reacts — "oh no." No dialogue beyond that beat.',
    ].join('\n'),
    twistRule: 'Every strip ends on the "oh no" beat — a visual-only reaction panel. No escape, no silver lining.',
    referenceWorks: 'Alex Norris / Webcomic Name.',
  },
  'technical-reframe': {
    key: 'technical-reframe',
    name: 'Technical reframe',
    summary: 'A banal human activity is described by aliens / robots / clinical observers in overly precise, literal terms.',
    structurePrompt: [
      'Tone: wholesome-observational. Characters speak in precise, stilted, literal language.',
      'Panel 1 (Setup): Aliens / beings observe a human doing a mundane thing. Describe the thing clinically in dialog.',
      'Panel 2 (Development): Another being adds a precise observation or question that reframes the activity.',
      'Panel 3 (Reframe): The clinical description reveals something absurd or tender about the human activity.',
      'Panel 4 (Landing): A soft, accepting line that closes the observation. Gentle, wholesome.',
    ].join('\n'),
    twistRule: 'The humor comes entirely from the translation, never from conflict. Dialog must avoid contractions and casual phrasing.',
    referenceWorks: 'Nathan W. Pyle / Strange Planet.',
  },
  'wholesome-twist': {
    key: 'wholesome-twist',
    name: 'Wholesome twist',
    summary: 'Cynical or dark setup resolves with unexpected kindness or sincerity.',
    structurePrompt: [
      'Tone: cynical-to-sincere. Set up expectations of conflict, subvert with warmth.',
      'Panel 1 (Setup): A character in a cynical, frustrated, or negative frame. Relatable modern grievance.',
      'Panel 2 (Build): Tension or conflict rises. Reader expects a bitter punchline.',
      'Panel 3 (Turn): A sincere, kind, or tender element enters. Unexpected.',
      'Panel 4 (Landing): The kindness lands. Character softens. No irony, no undercut.',
    ].join('\n'),
    twistRule: 'The ending must be sincerely warm, not ironic. Do not undercut the wholesome beat with a joke.',
    referenceWorks: 'Lunarbaboon, Extra Fabulous Comics (softer strips), many viral Reddit comics.',
  },
};

export function getArchetype(key: string | null | undefined): Archetype | null {
  if (!key) return null;
  return ARCHETYPES[key as ArchetypeKey] ?? null;
}

export const ARCHETYPE_KEYS = Object.keys(ARCHETYPES) as ArchetypeKey[];

export const YONKOMA_SYSTEM_PROMPT = [
  'You are a manga yonkoma (4-panel strip) writer.',
  'You write exactly 4-panel stories built on kishōtenketsu structure:',
  'Ki (introduction), Shō (development), Ten (twist/reframe), Ketsu (payoff).',
  'The turn is a reframing, not a conflict. Dialog is minimal. Characters stay in a consistent world.',
  'You respect the chosen archetype\'s tone rules absolutely.',
  'Respond ONLY with a valid JSON array. No markdown, no preamble.',
].join(' ');
