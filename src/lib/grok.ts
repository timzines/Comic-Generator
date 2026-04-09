import OpenAI from 'openai';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  _client = new OpenAI({
    apiKey: process.env.XAI_API_KEY ?? 'build-placeholder',
    baseURL: 'https://api.x.ai/v1',
  });
  return _client;
}

// Proxy so `grok.chat.completions.create(...)` still works, but construction is deferred.
export const grok: OpenAI = new Proxy({} as OpenAI, {
  get(_t, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const v = client[prop];
    return typeof v === 'function' ? (v as (...args: unknown[]) => unknown).bind(client) : v;
  },
}) as OpenAI;

export const GROK_MODEL = 'grok-3';

export function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}
