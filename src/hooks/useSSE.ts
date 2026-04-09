'use client';
import { useEffect, useState } from 'react';

export function useSSE<T = unknown>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [events, setEvents] = useState<T[]>([]);
  const [error, setError] = useState<Event | null>(null);
  const [isConnected, setConnected] = useState(false);

  useEffect(() => {
    if (!url) return;
    const es = new EventSource(url);
    setConnected(true);
    es.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data) as T;
        setData(parsed);
        setEvents((prev) => [...prev, parsed]);
      } catch {
        // ignore
      }
    };
    es.onerror = (ev) => {
      setError(ev);
      es.close();
      setConnected(false);
    };
    return () => {
      es.close();
      setConnected(false);
    };
  }, [url]);

  return { data, events, error, isConnected };
}
