import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { scrapeAllTrackedSubreddits } from '@/lib/reddit/scrape';

export async function POST() {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const summaries = await scrapeAllTrackedSubreddits();
    return NextResponse.json({ summaries });
  } catch (err) {
    console.error('[trends/refresh]', err);
    return NextResponse.json(
      { error: 'refresh_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}
