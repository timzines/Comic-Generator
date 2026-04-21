import { supabaseAdmin } from '@/lib/supabase/admin';
import { fetchSubredditListing, type RedditPostData } from './client';
import type { RedditWindow, ScrapeSummary } from '@/types/reddit';

type SortSpec = { window: RedditWindow; sort: 'rising' | 'top'; t?: 'day' | 'week' | 'month' };

const DEFAULT_SORTS: SortSpec[] = [
  { window: 'rising', sort: 'rising' },
  { window: 'day', sort: 'top', t: 'day' },
  { window: 'week', sort: 'top', t: 'week' },
];

function shouldSkip(p: RedditPostData): boolean {
  if (p.stickied) return true;
  if (p.distinguished === 'moderator') return true;
  if (p.author === 'AutoModerator') return true;
  if (p.removed_by_category) return true;
  if (p.crosspost_parent) return true;
  return false;
}

function previewUrl(p: RedditPostData): string | null {
  const raw = p.preview?.images?.[0]?.source?.url;
  if (!raw) return null;
  return raw.replace(/&amp;/g, '&');
}

function velocity(score: number, createdUtc: number, upvoteRatio: number): number {
  const nowSec = Date.now() / 1000;
  const ageHours = Math.max((nowSec - createdUtc) / 3600, 1);
  return (score / Math.pow(ageHours, 1.5)) * (upvoteRatio || 1);
}

function postRow(p: RedditPostData) {
  return {
    id: p.id,
    subreddit: p.subreddit,
    title: p.title,
    selftext: p.selftext || null,
    url: p.url || null,
    permalink: p.permalink ? `https://www.reddit.com${p.permalink}` : null,
    thumbnail: p.thumbnail && p.thumbnail.startsWith('http') ? p.thumbnail : null,
    preview_url: previewUrl(p),
    author: p.author || null,
    score: p.score ?? 0,
    upvote_ratio: p.upvote_ratio ?? null,
    num_comments: p.num_comments ?? 0,
    num_crossposts: p.num_crossposts ?? 0,
    is_video: !!p.is_video,
    is_self: !!p.is_self,
    over_18: !!p.over_18,
    link_flair_text: p.link_flair_text ?? null,
    post_hint: p.post_hint ?? null,
    domain: p.domain || null,
    created_utc: new Date(p.created_utc * 1000).toISOString(),
    last_scraped_at: new Date().toISOString(),
    raw: p as unknown as Record<string, unknown>,
  };
}

export async function scrapeSubredditSort(
  subreddit: string,
  spec: SortSpec,
): Promise<ScrapeSummary> {
  const summary: ScrapeSummary = { subreddit, window: spec.window, fetched: 0, inserted: 0, updated: 0 };
  try {
    const listing = await fetchSubredditListing(subreddit, { sort: spec.sort, t: spec.t, limit: 100 });

    const children = listing.data.children.map((c) => c.data).filter((p) => !shouldSkip(p));
    summary.fetched = children.length;
    if (children.length === 0) return summary;

    const rows = children.map(postRow);
    const { error: upErr } = await supabaseAdmin.from('reddit_posts').upsert(rows, { onConflict: 'id' });
    if (upErr) throw new Error(`upsert_posts: ${upErr.message}`);

    const rankings = children.map((p, i) => ({
      post_id: p.id,
      subreddit: p.subreddit,
      time_window: spec.window,
      rank: i + 1,
      score_snapshot: p.score ?? 0,
      velocity: velocity(p.score ?? 0, p.created_utc, p.upvote_ratio ?? 1),
    }));
    const { error: rankErr } = await supabaseAdmin.from('reddit_rankings').insert(rankings);
    if (rankErr) throw new Error(`insert_rankings: ${rankErr.message}`);

    summary.inserted = children.length;
    return summary;
  } catch (err) {
    summary.error = err instanceof Error ? err.message : 'unknown';
    return summary;
  }
}

export async function scrapeSubreddit(subreddit: string): Promise<ScrapeSummary[]> {
  const out: ScrapeSummary[] = [];
  for (const spec of DEFAULT_SORTS) {
    out.push(await scrapeSubredditSort(subreddit, spec));
  }
  return out;
}

export async function scrapeAllTrackedSubreddits(): Promise<ScrapeSummary[]> {
  const { data: tracked, error } = await supabaseAdmin
    .from('tracked_subreddits')
    .select('name, active')
    .eq('active', true);
  if (error) throw new Error(`load_tracked: ${error.message}`);

  const all: ScrapeSummary[] = [];
  for (const row of tracked ?? []) {
    const summaries = await scrapeSubreddit(row.name);
    all.push(...summaries);
  }
  return all;
}
