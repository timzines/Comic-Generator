import type { ActBreakdown } from './database';

export interface ResearchRequest {
  comicId: string;
  description: string;
  genre: string;
  style: string;
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
  tone: string;
}

export interface StoryOptionsRequest {
  comicId: string;
  description: string;
  genre: string;
  style: string;
  research: ResearchResponse;
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

export interface GeneratePanelsRequest {
  comicId: string;
}
export interface GeneratePanelsResponse {
  panels: { id: string; panelIndex: number; prompt: string }[];
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
  maskImage?: string;
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
