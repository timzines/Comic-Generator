const XAI_BASE = 'https://api.x.ai/v1';

export const GROK_MODEL = process.env.XAI_MODEL || 'grok-4.20-reasoning';

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokResponse {
  content: string;
}

/**
 * Call xAI's /v1/responses endpoint.
 * Accepts the same system + user message pattern we had before,
 * but maps to the responses API format.
 */
export async function grokChat(messages: GrokMessage[]): Promise<GrokResponse> {
  const apiKey = process.env.XAI_API_KEY ?? 'build-placeholder';

  const systemMsg = messages.find((m) => m.role === 'system');
  const userMsgs = messages.filter((m) => m.role !== 'system');

  // Build input: for multi-turn, pass as array of {role, content}
  const input = userMsgs.length === 1
    ? userMsgs[0].content
    : userMsgs.map((m) => ({ role: m.role, content: m.content }));

  const body: Record<string, unknown> = {
    model: GROK_MODEL,
    input,
  };

  if (systemMsg) {
    body.instructions = systemMsg.content;
  }

  const res = await fetch(`${XAI_BASE}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`xAI API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  // Extract text from the response output
  let content = '';
  if (data.output_text) {
    content = data.output_text;
  } else if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item.type === 'message' && Array.isArray(item.content)) {
        for (const block of item.content) {
          if (block.type === 'output_text' || block.type === 'text') {
            content += block.text;
          }
        }
      }
    }
  } else if (typeof data.output === 'string') {
    content = data.output;
  }

  if (!content) {
    throw new Error(`xAI API returned no content: ${JSON.stringify(data).slice(0, 500)}`);
  }

  return { content };
}

export function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}
