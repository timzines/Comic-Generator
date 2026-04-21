const REDDIT_PUBLIC_BASE = 'https://www.reddit.com';

export interface RedditFetchOptions {
  sort: 'top' | 'rising' | 'hot' | 'new' | 'controversial';
  t?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  limit?: number;
}

export interface RedditListing {
  kind: 'Listing';
  data: {
    after: string | null;
    before: string | null;
    children: Array<{ kind: 't3'; data: RedditPostData }>;
  };
}

export interface RedditPostData {
  id: string;
  name: string;
  subreddit: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  thumbnail: string;
  preview?: {
    images?: Array<{ source?: { url: string } }>;
  };
  author: string;
  score: number;
  ups: number;
  upvote_ratio: number;
  num_comments: number;
  num_crossposts: number;
  is_video: boolean;
  is_self: boolean;
  over_18: boolean;
  stickied: boolean;
  distinguished: string | null;
  link_flair_text: string | null;
  post_hint?: string;
  domain: string;
  created_utc: number;
  crosspost_parent?: string;
  removed_by_category?: string | null;
}

function userAgent(): string {
  return process.env.REDDIT_USER_AGENT ?? 'comic-studio/0.1 (by u/timzines)';
}

export async function fetchSubredditListing(
  subreddit: string,
  opts: RedditFetchOptions,
): Promise<RedditListing> {
  const params = new URLSearchParams();
  if (opts.t) params.set('t', opts.t);
  params.set('limit', String(opts.limit ?? 100));
  params.set('raw_json', '1');

  const url = `${REDDIT_PUBLIC_BASE}/r/${encodeURIComponent(subreddit)}/${opts.sort}.json?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': userAgent(),
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reddit listing ${subreddit}/${opts.sort} failed ${res.status}: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as RedditListing;
}
