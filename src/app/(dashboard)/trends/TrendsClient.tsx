'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import type { RankedPost, RedditWindow, TrackedSubreddit } from '@/types/reddit';

const WINDOWS: { key: RedditWindow; label: string }[] = [
  { key: 'rising', label: 'Rising' },
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This week' },
];

function formatAgo(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function thumbSrc(p: RankedPost): string | null {
  return p.preview_url || p.thumbnail || null;
}

export function TrendsClient() {
  const [subs, setSubs] = useState<TrackedSubreddit[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [window, setWindow] = useState<RedditWindow>('rising');
  const [posts, setPosts] = useState<RankedPost[]>([]);
  const [latestScrapedAt, setLatestScrapedAt] = useState<string | null>(null);
  const [newSub, setNewSub] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadSubs = useCallback(async () => {
    const res = await fetch('/api/trends/subreddits');
    if (!res.ok) return;
    const data = (await res.json()) as { subreddits: TrackedSubreddit[] };
    setSubs(data.subreddits);
    setActive((prev) => prev ?? data.subreddits[0]?.name ?? null);
  }, []);

  const loadPosts = useCallback(async () => {
    if (!active) {
      setPosts([]);
      setLatestScrapedAt(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/trends/posts?subreddit=${encodeURIComponent(active)}&window=${window}&limit=30`);
      if (!res.ok) throw new Error('load_failed');
      const data = (await res.json()) as { posts: RankedPost[]; latestScrapedAt: string | null };
      setPosts(data.posts);
      setLatestScrapedAt(data.latestScrapedAt);
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'error', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [active, window]);

  useEffect(() => {
    loadSubs();
  }, [loadSubs]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function addSub() {
    const name = newSub.trim().replace(/^\/?r\//i, '');
    if (!name) return;
    const res = await fetch('/api/trends/subreddits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setToast({ msg: 'Invalid subreddit name', type: 'error' });
      return;
    }
    setNewSub('');
    await loadSubs();
    setActive(name);
    setToast({ msg: `Added r/${name}`, type: 'success' });
  }

  async function removeSub(name: string) {
    if (!confirm(`Stop tracking r/${name}?`)) return;
    const res = await fetch(`/api/trends/subreddits?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (!res.ok) {
      setToast({ msg: 'Remove failed', type: 'error' });
      return;
    }
    if (active === name) setActive(null);
    await loadSubs();
  }

  async function refreshAll() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/trends/refresh', { method: 'POST' });
      if (!res.ok) throw new Error('refresh_failed');
      setToast({ msg: 'Scrape complete', type: 'success' });
      await loadPosts();
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'error', type: 'error' });
    } finally {
      setRefreshing(false);
    }
  }

  const activeTitle = useMemo(() => (active ? `r/${active}` : 'No subreddit selected'), [active]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold">Trends</h1>
          <p className="text-white/50 text-sm mt-1">Manga subreddit pulse. Seed new comics from what's hot.</p>
        </div>
        <Button onClick={refreshAll} loading={refreshing}>Refresh now</Button>
      </div>

      <div className="bg-surface border border-white/10 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSub()}
            placeholder="Add subreddit (e.g. manga, MangaArt, webcomics)"
            className="flex-1 bg-bg border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <Button onClick={addSub} variant="ghost">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {subs.length === 0 && <p className="text-xs text-white/40">No subreddits tracked yet.</p>}
          {subs.map((s) => (
            <div
              key={s.name}
              className={`flex items-center gap-1 rounded-md border text-xs ${
                active === s.name ? 'border-accent bg-accent/10' : 'border-white/10 bg-bg'
              }`}
            >
              <button onClick={() => setActive(s.name)} className="pl-3 py-1.5 text-white/80">
                r/{s.name}
              </button>
              <button
                onClick={() => removeSub(s.name)}
                className="px-2 py-1.5 text-white/40 hover:text-red-300"
                aria-label={`Remove r/${s.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">{activeTitle}</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {latestScrapedAt ? `Scraped ${formatAgo(latestScrapedAt)}` : 'No scrape yet — hit Refresh'}
          </p>
        </div>
        <div className="flex gap-1 bg-surface border border-white/10 rounded-md p-1">
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setWindow(w.key)}
              className={`px-3 py-1.5 text-xs rounded transition ${
                window === w.key ? 'bg-accent text-bg font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-white/40 text-sm">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="text-white/40 text-sm">No posts for this window yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => (
            <PostCard key={`${p.id}-${p.rank}`} post={p} />
          ))}
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function PostCard({ post }: { post: RankedPost }) {
  const thumb = thumbSrc(post);
  const seedQuery = new URLSearchParams({
    title: post.title,
    description: post.selftext?.slice(0, 500) || post.title,
  }).toString();
  return (
    <div className="bg-surface border border-white/10 rounded-lg overflow-hidden flex flex-col">
      <div className="aspect-video bg-bg relative">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">no preview</div>
        )}
        <div className="absolute top-2 left-2 bg-bg/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-accent">
          #{post.rank}
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col gap-2">
        <h3 className="text-sm font-semibold leading-snug line-clamp-3">{post.title}</h3>
        <div className="flex items-center gap-3 text-[11px] text-white/50">
          <span>↑ {post.score.toLocaleString()}</span>
          <span>💬 {post.num_comments.toLocaleString()}</span>
          {post.velocity != null && <span>⚡ {post.velocity.toFixed(1)}</span>}
          <span className="ml-auto">u/{post.author ?? '—'}</span>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-2">
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-white/50 hover:text-white"
            >
              Open ↗
            </a>
          )}
          <Link
            href={`/new?${seedQuery}`}
            className="ml-auto bg-accent text-bg text-[11px] font-semibold px-3 py-1.5 rounded-md hover:opacity-90"
          >
            Seed comic →
          </Link>
        </div>
      </div>
    </div>
  );
}
