import type { ActBreakdown, PageStructure } from './database';
import type { ArchetypeKey } from '@/lib/story/archetypes';

export interface ResearchRequest {
  comicId: string;
  description: string;
}
export interface ResearchResponse {
  inspirations: string[];
  themes: string[];
}

export interface StoryOptionData {
  title: string;
  logline: string;
  actBreakdown: ActBreakdown[];
  estimatedPanels: number;
  estimatedPages: number;
  pageStructure: PageStructure[];
  tone: string;
}

export interface StoryOptionsRequest {
  comicId: string;
  description: string;
  research: ResearchResponse;
  archetype?: ArchetypeKey;
}
export interface StoryOptionsResponse {
  options: StoryOptionData[];
}

export interface SelectOptionRequest {
  comicId: string;
  optionIndex: number;
}
export interface SelectOptionResponse {
  characterBible: string;
}

export interface EditStorylineRequest {
  comicId: string;
  editPrompt: string;
}
export interface EditStorylineResponse {
  options: StoryOptionData[];
}

export interface GeneratePanelsRequest {
  comicId: string;
  archetype?: ArchetypeKey;
}

export interface ScoreRequest {
  option: StoryOptionData;
  archetype?: ArchetypeKey;
}
export interface ScoreResponse {
  score: number;
  rationale: string;
}

export interface AutopilotRequest {
  title: string;
  description: string;
  archetype?: ArchetypeKey;
}

export type AutopilotStage = 'create' | 'research' | 'options' | 'score' | 'select' | 'panels' | 'images' | 'done';

export type AutopilotEvent =
  | { type: 'start'; comicId: string }
  | { type: 'stage'; stage: AutopilotStage; detail?: string }
  | { type: 'score'; optionIndex: number; score: number; rationale: string }
  | { type: 'selected'; optionIndex: number; score: number }
  | { type: 'panel'; panelIndex: number; imageUrl: string }
  | { type: 'panelError'; panelIndex: number; message: string }
  | { type: 'complete'; comicId: string; panelCount: number; errorCount: number }
  | { type: 'error'; stage: AutopilotStage; message: string };
export interface GeneratePanelsResponse {
  panels: { id: string; panelIndex: number; pageNumber: number; positionInPage: number; prompt: string; dialog: string | null }[];
}

export interface GenerateImageRequest {
  panelId: string;
  comicId: string;
}
export interface GenerateImageResponse {
  imageUrl: string;
}

export interface EditImageRequest {
  panelId: string;
  comicId: string;
  editPrompt: string;
  referenceImageUrl?: string;
}
export interface EditImageResponse {
  imageUrl: string;
}

export type SSEEvent =
  | { type: 'start'; total: number }
  | { type: 'progress'; panelId: string; panelIndex: number; status: 'generating' }
  | { type: 'done'; panelId: string; panelIndex: number; imageUrl: string }
  | { type: 'error'; panelId: string; panelIndex: number; error: string }
  | { type: 'complete'; generated: number; errors: number };
