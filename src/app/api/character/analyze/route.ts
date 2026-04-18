import { NextResponse, type NextRequest } from 'next/server';
import { ANALYSIS_SYSTEM_PROMPT, ANALYSIS_USER_PROMPT } from '@/lib/character/analysisPrompt';
import { CharacterSheetSchema } from '@/lib/character/schema';
import { buildMasterPrompt } from '@/lib/character/promptAssembler';
import { stripJsonFences } from '@/lib/grok';

const XAI_BASE = 'https://api.x.ai/v1';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mediaType } = (await request.json()) as {
      imageBase64: string;
      mediaType: string;
    };

    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const apiKey = process.env.XAI_API_KEY ?? '';
    if (!apiKey || apiKey === 'build-placeholder') {
      return NextResponse.json({ error: 'XAI_API_KEY not configured' }, { status: 500 });
    }

    // Use Grok vision via chat completions (vision requires this endpoint)
    const dataUrl = `data:${mediaType};base64,${imageBase64}`;

    const res = await fetch(`${XAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || 'grok-4.20-reasoning',
        messages: [
          {
            role: 'system',
            content: ANALYSIS_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
              {
                type: 'text',
                text: ANALYSIS_USER_PROMPT,
              },
            ],
          },
        ],
        max_tokens: 8000,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[character/analyze] xAI error:', res.status, text);
      return NextResponse.json(
        { error: 'analysis_failed', detail: `xAI API error ${res.status}: ${text.slice(0, 200)}` },
        { status: 500 },
      );
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content ?? '';

    if (!rawText) {
      return NextResponse.json({ error: 'empty_response' }, { status: 500 });
    }

    const cleaned = stripJsonFences(rawText);
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('[character/analyze] JSON parse failed:', rawText.slice(0, 500));
      return NextResponse.json(
        { error: 'invalid_json', detail: 'Model did not return valid JSON' },
        { status: 500 },
      );
    }

    const sheet = CharacterSheetSchema.parse(parsed);

    // Rebuild master_prompt locally to ensure quality
    sheet.master_prompt = buildMasterPrompt(sheet);

    return NextResponse.json({ sheet });
  } catch (err) {
    console.error('[character/analyze]', err);
    const message = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: 'analysis_failed', detail: message }, { status: 500 });
  }
}
