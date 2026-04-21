import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { RedditWindow, RankedPost } from '@/types/reddit';

const WINDOWS: readonly RedditWindow[] = ['rising', 'day', 'week', 'month'] as const;

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const subreddit = url.searchParams.get('subreddit');
  const windowParam = url.searchParams.get('window') ?? 'day';
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 30), 100);

  if (!WINDOWS.includes(windowParam as RedditWindow)) {
    return NextResponse.json({ error: 'invalid_window' }, { status: 400 });
  }
  if (!subreddit) return NextResponse.json({ error: 'missing_subreddit' }, { status: 400 });

  const { data: latestRow } = await supabaseAdmin
    .from('reddit_rankings')
    .select('scraped_at')
    .eq('subreddit', subreddit)
    .eq('time_window', windowParam)
    .order('scraped_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestRow?.scraped_at) return NextResponse.json({ posts: [], latestScrapedAt: null });

  const { data: rankings, error } = await supabaseAdmin
    .from('reddit_rankings')
    .select('rank, velocity, scraped_at, time_window, subreddit, reddit_posts(*)')
    .eq('subreddit', subreddit)
    .eq('time_window', windowParam)
    .eq('scraped_at', latestRow.scraped_at)
    .order('rank', { ascending: true })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const posts: RankedPost[] = (rankings ?? [])
    .filter((r) => r.reddit_posts)
    .map((r) => {
      const post = Array.isArray(r.reddit_posts) ? r.reddit_posts[0] : r.reddit_posts;
      return {
        ...(post as RankedPost),
        rank: r.rank,
        velocity: r.velocity,
        window: r.time_window as RedditWindow,
      };
    });

  return NextResponse.json({ posts, latestScrapedAt: latestRow.scraped_at });
}
