// Briefing generation schema + prompt. Kept free of any InsForge import so the
// Trigger.dev task can reuse it without pulling in the throwing lib/insforge singleton.
import { Type } from '@google/genai';
import type { InboxMessage } from '@/lib/integration-mcp';

export const CATEGORY_KEYS = ['email', 'messages', 'mentions', 'tasks', 'followups'] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export type BriefingCategory = { key: CategoryKey; count: number; summary: string };
export type BriefingTop = { title: string; summary: string; highlights: string[] };
export type BriefingResult = { top: BriefingTop; categories: BriefingCategory[] };

export const briefingSchema = {
  type: Type.OBJECT,
  properties: {
    top: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['title', 'summary', 'highlights'],
    },
    categories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING, enum: [...CATEGORY_KEYS] },
          count: { type: Type.INTEGER },
          summary: { type: Type.STRING },
        },
        required: ['key', 'count', 'summary'],
      },
    },
  },
  required: ['top', 'categories'],
};

export type BriefingItems = { platform: string; messages: InboxMessage[] }[];

export function buildBriefingPrompt(items: BriefingItems, goal?: string, categories?: string[]) {
  const compact = items.map((item) => ({
    platform: item.platform,
    messages: item.messages.slice(0, 8).map((message) => ({
      sender: message.sender,
      subject: message.subject,
      preview: message.preview.slice(0, 160),
      time: message.time,
      tags: message.tags,
    })),
  }));

  return [
    'You are a fast personal assistant producing a daily briefing.',
    'Output JSON with "top" (title max 8 words, summary max 30 words, highlights: up to 4 short strings)',
    'and "categories": one object per category that has ANY relevant items, using keys from',
    `[${CATEGORY_KEYS.join(', ')}]. Each: key, count (integer of items in that category), summary (max 18 words).`,
    'Map emails->email, chat/DMs->messages, @-mentions->mentions, action items/todos->tasks, waiting-on replies->followups.',
    goal ? `USER GOAL/PRIORITY: ${goal}` : '',
    categories?.length ? `ONLY produce these categories: ${categories.join(', ')}` : '',
    '',
    'DATA:',
    JSON.stringify(compact),
  ]
    .filter(Boolean)
    .join('\n');
}
