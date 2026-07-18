import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  briefingSchema,
  buildBriefingPrompt,
  type BriefingItems,
} from '@/lib/briefing-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GenerateRequest = {
  items?: BriefingItems;
  goal?: string;
  categories?: string[];
};

const emptyBriefing = {
  top: {
    title: 'All clear',
    summary: 'No new items to brief right now.',
    highlights: [],
  },
  categories: [],
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: 'AI briefing unavailable. Set GEMINI_API_KEY to enable it.' },
      { status: 503 }
    );

  const { items, goal, categories } = (await request
    .json()
    .catch(() => ({}))) as GenerateRequest;
  const total =
    items?.reduce((count, item) => count + (item.messages?.length ?? 0), 0) ??
    0;
  if (!items?.length || total === 0) return NextResponse.json(emptyBriefing);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
    const response = await ai.models.generateContent({
      model,
      contents: buildBriefingPrompt(items, goal, categories),
      config: {
        responseMimeType: 'application/json',
        responseSchema: briefingSchema,
        maxOutputTokens: 900,
        temperature: 0.3,
      },
    });
    return NextResponse.json(JSON.parse(response.text ?? '{}'));
  } catch (error) {
    console.error('[briefing/generate] gemini error', error);
    return NextResponse.json(
      { error: 'Could not generate the briefing.' },
      { status: 502 }
    );
  }
}
