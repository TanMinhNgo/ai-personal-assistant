import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ComposeRequest = {
  channel?: 'email' | 'message';
  context?: string;
  recipient?: string;
  goal?: string;
  tone?: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI compose unavailable. Set GEMINI_API_KEY to enable it.' }, { status: 503 });

  const { channel = 'email', context = '', recipient = '', goal = '', tone = 'professional' } = (await request.json().catch(() => ({}))) as ComposeRequest;

  const prompt = [
    `Draft a ${channel === 'email' ? 'concise email' : 'short chat message'} in a ${tone} tone.`,
    channel === 'email'
      ? 'Return only the body text — no subject line, no markdown, no placeholders like [Name].'
      : 'Return one or two sentences only. No greeting boilerplate, no markdown.',
    recipient ? `Recipient: ${recipient}` : '',
    goal ? `What the user wants to say: ${goal}` : '',
    context ? `Context to respond to:\n${context.slice(0, 1500)}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { maxOutputTokens: 500, temperature: 0.6 },
    });
    return NextResponse.json({ draft: (response.text ?? '').trim() });
  } catch (error) {
    console.error('[briefing/compose] gemini error', error);
    return NextResponse.json({ error: 'Could not draft the message.' }, { status: 502 });
  }
}
