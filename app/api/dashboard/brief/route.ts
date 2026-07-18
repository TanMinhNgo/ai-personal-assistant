import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { InboxMessage } from '@/lib/integration-mcp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BriefPart = 'brief' | 'priorities';
type BriefRequest = {
  items?: { platform: string; messages: InboxMessage[] }[];
  part?: BriefPart;
};

const briefSchema = {
  type: Type.OBJECT,
  properties: {
    brief: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING },
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          icon: { type: Type.STRING },
        },
        required: ['platform', 'title', 'summary', 'icon'],
      },
    },
  },
  required: ['brief'],
};

const prioritiesSchema = {
  type: Type.OBJECT,
  properties: {
    priorities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING },
          title: { type: Type.STRING },
          time: { type: Type.STRING },
          context: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
        },
        required: ['platform', 'title', 'time', 'context', 'priority'],
      },
    },
  },
  required: ['priorities'],
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI brief unavailable. Set GEMINI_API_KEY to enable it.' },
      { status: 503 }
    );
  }

  const { items, part = 'brief' } = (await request
    .json()
    .catch(() => ({}))) as BriefRequest;
  const total =
    items?.reduce((count, item) => count + (item.messages?.length ?? 0), 0) ??
    0;
  if (!items?.length || total === 0) {
    return NextResponse.json(
      part === 'priorities' ? { priorities: [] } : { brief: [] }
    );
  }

  // Trim aggressively so the prompt stays tiny and the model responds in a few seconds.
  const compact = items.map((item) => ({
    platform: item.platform,
    messages: item.messages.slice(0, 6).map((message) => ({
      sender: message.sender,
      subject: message.subject,
      preview: message.preview.slice(0, 140),
      time: message.time,
      tags: message.tags,
    })),
  }));

  const prompt =
    part === 'priorities'
      ? [
          'You are a fast personal assistant. From these messages, output a "priorities" array of AT MOST 3 items.',
          'Each item: platform (a platform id present in the data), title (max 6 words), time (short), context (max 10 words),',
          'priority ("high" | "medium" | "low"). Be terse and quick. Only use platform ids present in the data.',
          '',
          'DATA:',
          JSON.stringify(compact),
        ].join('\n')
      : [
          'You are a fast personal assistant. From these messages, output a "brief" array of AT MOST 4 items.',
          'Each item: platform (a platform id present in the data), title (max 6 words), summary (max 12 words),',
          'icon (one of: mail, message-circle, bell, calendar, users, file-text). Be terse and quick.',
          'Only use platform ids present in the data.',
          '',
          'DATA:',
          JSON.stringify(compact),
        ].join('\n');

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: part === 'priorities' ? prioritiesSchema : briefSchema,
        maxOutputTokens: 600,
        temperature: 0.3,
      },
    });
    return NextResponse.json(JSON.parse(response.text ?? '{}'));
  } catch (error) {
    console.error('[dashboard/brief] gemini error', error);
    return NextResponse.json(
      { error: 'Could not generate the brief.' },
      { status: 502 }
    );
  }
}
