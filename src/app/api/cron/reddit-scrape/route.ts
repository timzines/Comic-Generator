import { NextResponse, type NextRequest } from 'next/server';
import { scrapeAllTrackedSubreddits } from '@/lib/reddit/scrape';

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 });

  const provided = request.headers.get('x-cron-secret');
  if (provided !== expected) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const summaries = await scrapeAllTrackedSubreddits();
    return NextResponse.json({ summaries });
  } catch (err) {
    console.error('[cron/reddit-scrape]', err);
    return NextResponse.json(
      { error: 'scrape_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
