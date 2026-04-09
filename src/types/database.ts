export type ComicStatus = 'drafting' | 'generating' | 'done' | 'error';
export type PanelStatus = 'pending' | 'generating' | 'done' | 'error';

export interface ActBreakdown {
  act: string;
  desc: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Comic {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  genre: string | null;
  style: string | null;
  custom_style: string | null;
  status: ComicStatus;
  character_bible: string | null;
  panel_count: number;
  created_at: string;
  updated_at: string;
}

export interface StoryOption {
  id: string;
  comic_id: string;
  option_index: number;
  title: string;
  logline: string | null;
  act_breakdown: ActBreakdown[] | null;
  estimated_panels: number | null;
  tone: string | null;
  selected: boolean;
  created_at: string;
}

export interface Panel {
  id: string;
  comic_id: string;
  panel_index: number;
  prompt: string | null;
  image_url: string | null;
  storage_path: string | null;
  status: PanelStatus;
  created_at: string;
  updated_at: string;
}

export interface ReferenceImage {
  id: string;
  comic_id: string;
  storage_path: string;
  public_url: string | null;
  label: string | null;
  created_at: string;
}

export type ComicWithDetails = Comic & {
  story_options: StoryOption[];
  panels: Panel[];
  reference_images: ReferenceImage[];
};
