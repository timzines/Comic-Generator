-- Migration 004: Autopilot support (archetype column + pending_review status)
-- Run this in the Supabase SQL editor

-- Add archetype column to comics
ALTER TABLE comics ADD COLUMN IF NOT EXISTS archetype text;

-- Extend comic_status enum with pending_review
-- (Postgres requires ALTER TYPE to add enum values)
DO $$ BEGIN
  ALTER TYPE comic_status ADD VALUE IF NOT EXISTS 'pending_review';
EXCEPTION WHEN duplicate_object THEN null; END $$;
