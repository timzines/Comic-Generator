-- Comic Studio — Full schema
-- Paste this entire file into the Supabase SQL editor and run.

-- =========================================================
-- Extensions
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- Enums
-- =========================================================
DO $$ BEGIN
  CREATE TYPE comic_status AS ENUM ('drafting','generating','done','error');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE panel_status AS ENUM ('pending','generating','done','error');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========================================================
-- Tables
-- =========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  genre text,
  style text,
  custom_style text,
  status comic_status DEFAULT 'drafting',
  character_bible text,
  panel_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS story_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comic_id uuid NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  option_index integer NOT NULL,
  title text NOT NULL,
  logline text,
  act_breakdown jsonb,
  estimated_panels integer,
  tone text,
  selected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS panels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comic_id uuid NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  panel_index integer NOT NULL,
  prompt text,
  image_url text,
  storage_path text,
  status panel_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reference_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comic_id uuid NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text,
  label text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comics_user_id ON comics(user_id);
CREATE INDEX IF NOT EXISTS idx_panels_comic_id ON panels(comic_id);
CREATE INDEX IF NOT EXISTS idx_story_options_comic_id ON story_options(comic_id);
CREATE INDEX IF NOT EXISTS idx_reference_images_comic_id ON reference_images(comic_id);

-- =========================================================
-- Row Level Security
-- =========================================================
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE comics           ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_options    ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_images ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- comics
DROP POLICY IF EXISTS "comics_select_own" ON comics;
CREATE POLICY "comics_select_own" ON comics FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "comics_insert_own" ON comics;
CREATE POLICY "comics_insert_own" ON comics FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "comics_update_own" ON comics;
CREATE POLICY "comics_update_own" ON comics FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "comics_delete_own" ON comics;
CREATE POLICY "comics_delete_own" ON comics FOR DELETE USING (user_id = auth.uid());

-- story_options
DROP POLICY IF EXISTS "story_options_all" ON story_options;
CREATE POLICY "story_options_all" ON story_options FOR ALL
USING (EXISTS (SELECT 1 FROM comics c WHERE c.id = story_options.comic_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM comics c WHERE c.id = story_options.comic_id AND c.user_id = auth.uid()));

-- panels
DROP POLICY IF EXISTS "panels_all" ON panels;
CREATE POLICY "panels_all" ON panels FOR ALL
USING (EXISTS (SELECT 1 FROM comics c WHERE c.id = panels.comic_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM comics c WHERE c.id = panels.comic_id AND c.user_id = auth.uid()));

-- reference_images
DROP POLICY IF EXISTS "reference_images_all" ON reference_images;
CREATE POLICY "reference_images_all" ON reference_images FOR ALL
USING (EXISTS (SELECT 1 FROM comics c WHERE c.id = reference_images.comic_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM comics c WHERE c.id = reference_images.comic_id AND c.user_id = auth.uid()));

-- =========================================================
-- Triggers
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS comics_set_updated_at ON comics;
CREATE TRIGGER comics_set_updated_at BEFORE UPDATE ON comics
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS panels_set_updated_at ON panels;
CREATE TRIGGER panels_set_updated_at BEFORE UPDATE ON panels
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- Storage buckets (create manually in Supabase Dashboard > Storage)
-- =========================================================
-- Bucket 1: "comic-panels"     (private)
-- Bucket 2: "reference-images" (private)
-- Then add storage policies so authenticated users can read/write
-- objects under paths beginning with their own uid.
