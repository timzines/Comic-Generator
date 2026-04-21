export type RedditWindow = 'rising' | 'day' | 'week' | 'month';

export interface TrackedSubreddit {
  name: string;
  active: boolean;
  created_at: string;
}

export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  selftext: string | null;
  url: string | null;
  permalink: string | null;
  thumbnail: string | null;
  preview_url: string | null;
  author: string | null;
  score: number;
  upvote_ratio: number | null;
  num_comments: number;
  num_crossposts: number;
  is_video: boolean;
  is_self: boolean;
  over_18: boolean;
  link_flair_text: string | null;
  post_hint: string | null;
  domain: string | null;
  created_utc: string;
  first_seen_at: string;
  last_scraped_at: string;
}

export interface RedditRanking {
  post_id: string;
  subreddit: string;
  time_window: RedditWindow;
  rank: number;
  score_snapshot: number | null;
  velocity: number | null;
  scraped_at: string;
}

export interface RankedPost extends RedditPost {
  rank: number;
  velocity: number | null;
  window: RedditWindow;
}

export interface ScrapeSummary {
  subreddit: string;
  window: RedditWindow;
  fetched: number;
  inserted: number;
  updated: number;
  error?: string;
}
