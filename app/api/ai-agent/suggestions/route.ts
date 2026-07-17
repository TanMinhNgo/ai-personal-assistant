import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const suggestionsSchema = {
  type: Type.OBJECT,
  properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
  required: ['suggestions'],
};

type SuggestRequest = { question?: string; answer?: string };

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ suggestions: [] });

  const { question, answer } = (await request.json().catch(() => ({}))) as SuggestRequest;
  if (!answer) return NextResponse.json({ suggestions: [] });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Given this Q&A, propose exactly 3 short follow-up questions the user might ask next. Each under 8 words, no numbering.\n\nQ: ${question ?? ''}\nA: ${answer.slice(0, 1500)}`,
            },
          ],
        },
      ],
      config: { responseMimeType: 'application/json', responseSchema: suggestionsSchema, maxOutputTokens: 200, temperature: 0.7 },
    });
    const parsed = JSON.parse(response.text ?? '{}') as { suggestions?: string[] };
    return NextResponse.json({ suggestions: (parsed.suggestions ?? []).slice(0, 3) });
  } catch (error) {
    console.error('[ai-agent/suggestions] gemini error', error);
    return NextResponse.json({ suggestions: [] });
  }
}
