-- Migration 003: Reddit trend harvester tables
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS tracked_subreddits (
  name text PRIMARY KEY,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reddit_posts (
  id text PRIMARY KEY,
  subreddit text NOT NULL,
  title text NOT NULL,
  selftext text,
  url text,
  permalink text,
  thumbnail text,
  preview_url text,
  author text,
  score integer DEFAULT 0,
  upvote_ratio real,
  num_comments integer DEFAULT 0,
  num_crossposts integer DEFAULT 0,
  is_video boolean DEFAULT false,
  is_self boolean DEFAULT false,
  over_18 boolean DEFAULT false,
  link_flair_text text,
  post_hint text,
  domain text,
  created_utc timestamptz NOT NULL,
  first_seen_at timestamptz DEFAULT now(),
  last_scraped_at timestamptz DEFAULT now(),
  raw jsonb
);

CREATE INDEX IF NOT EXISTS idx_reddit_posts_subreddit ON reddit_posts (subreddit, created_utc DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_first_seen ON reddit_posts (first_seen_at DESC);

CREATE TABLE IF NOT EXISTS reddit_rankings (
  post_id text NOT NULL REFERENCES reddit_posts(id) ON DELETE CASCADE,
  subreddit text NOT NULL,
  time_window text NOT NULL,
  rank integer NOT NULL,
  score_snapshot integer,
  velocity real,
  scraped_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, time_window, scraped_at)
);

CREATE INDEX IF NOT EXISTS idx_reddit_rankings_sub_window ON reddit_rankings (subreddit, time_window, scraped_at DESC);

ALTER TABLE tracked_subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_rankings    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracked_subreddits_all_auth" ON tracked_subreddits;
CREATE POLICY "tracked_subreddits_all_auth" ON tracked_subreddits FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "reddit_posts_select_auth" ON reddit_posts;
CREATE POLICY "reddit_posts_select_auth" ON reddit_posts FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "reddit_rankings_select_auth" ON reddit_rankings;
CREATE POLICY "reddit_rankings_select_auth" ON reddit_rankings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Seed the two manga subs the user specified
INSERT INTO tracked_subreddits (name) VALUES ('manga'), ('MangaArt')
ON CONFLICT (name) DO NOTHING;
