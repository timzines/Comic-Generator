-- Migration 002: Add page structure + dialog to panels, page_count to comics
-- Run this in the Supabase SQL editor

-- Add page-based columns to panels
ALTER TABLE panels ADD COLUMN IF NOT EXISTS page_number integer DEFAULT 0;
ALTER TABLE panels ADD COLUMN IF NOT EXISTS position_in_page integer DEFAULT 0;
ALTER TABLE panels ADD COLUMN IF NOT EXISTS dialog text;

-- Add page_count to comics (separate from panel_count)
ALTER TABLE comics ADD COLUMN IF NOT EXISTS page_count integer DEFAULT 0;

-- Add storyline_prompt for editing storylines
ALTER TABLE comics ADD COLUMN IF NOT EXISTS storyline_prompt text;

-- Index for page-based queries
CREATE INDEX IF NOT EXISTS idx_panels_page ON panels(comic_id, page_number, position_in_page);

-- Add estimated_pages to story_options
ALTER TABLE story_options ADD COLUMN IF NOT EXISTS estimated_pages integer;
ALTER TABLE story_options ADD COLUMN IF NOT EXISTS page_structure jsonb;
