import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { InboxMessage } from '@/lib/integration-mcp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BriefRequest = { items?: { platform: string; messages: InboxMessage[] }[] };

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    stats: {
      type: Type.OBJECT,
      properties: {
        important: { type: Type.INTEGER },
        priority: { type: Type.INTEGER },
        followUps: { type: Type.INTEGER },
      },
      required: ['important', 'priority', 'followUps'],
    },
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
  required: ['stats', 'brief', 'priorities'],
};

const emptyBrief = { stats: { important: 0, priority: 0, followUps: 0 }, brief: [], priorities: [] };

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI brief unavailable. Set GEMINI_API_KEY to enable it.' }, { status: 503 });
  }

  const { items } = (await request.json().catch(() => ({}))) as BriefRequest;
  const total = items?.reduce((count, item) => count + (item.messages?.length ?? 0), 0) ?? 0;
  if (!items?.length || total === 0) return NextResponse.json(emptyBrief);

  // Trim the payload so the prompt stays small and cheap.
  const compact = items.map((item) => ({
    platform: item.platform,
    messages: item.messages.slice(0, 8).map((message) => ({
      sender: message.sender,
      subject: message.subject,
      preview: message.preview,
      time: message.time,
      tags: message.tags,
    })),
  }));

  const prompt = [
    'You are a personal assistant creating a daily brief. From these messages across the',
    "user's connected platforms, produce JSON with:",
    '(1) stats = counts of important, priority, and follow-up messages;',
    '(2) brief = up to 5 short human summaries, each with the source platform id and a lucide icon',
    'name (one of: mail, message-circle, bell, calendar, users, file-text);',
    '(3) priorities = the top 3-4 items, each with a high/medium/low priority.',
    'Use ONLY platform ids that appear in the data for the "platform" field. Keep every summary',
    'and context under 20 words. Write in a warm, concise assistant voice.',
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
      config: { responseMimeType: 'application/json', responseSchema },
    });
    return NextResponse.json(JSON.parse(response.text ?? '{}'));
  } catch (error) {
    console.error('[dashboard/brief] gemini error', error);
    return NextResponse.json({ error: 'Could not generate the brief.' }, { status: 502 });
  }
}
