// Client-side helpers for gathering connected-app messages, persisting the
// per-user snapshot (the bridge the background job reads), and deriving instant
// category counts. Used by the dashboard and the briefing page.
import type { InboxMessage } from '@/lib/integration-mcp';
import { CATEGORY_KEYS, type CategoryKey } from '@/lib/briefing-ai';
import { insforge } from '@/lib/insforge';

export type GatheredItems = { platform: string; messages: InboxMessage[] }[];

const EMAIL_PLATFORMS = new Set(['gmail', 'outlook']);

// Platforms that expose a real per-user data endpoint. Only these contribute to
// briefings — connected-but-unintegrated platforms add nothing (no mock data).
export const LIVE_PLATFORMS: Record<string, string> = {
  gmail: '/api/gmail/messages',
};

export async function fetchMessages(url: string): Promise<InboxMessage[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = (await response.json()) as { messages?: InboxMessage[] };
    return data.messages ?? [];
  } catch {
    return [];
  }
}

export async function gatherItems(
  userId: string,
  connectedIds: string[]
): Promise<GatheredItems> {
  const liveIds = connectedIds.filter((id) => LIVE_PLATFORMS[id]);
  const results = await Promise.all(
    liveIds.map(async (id) => ({
      platform: id,
      messages: await fetchMessages(LIVE_PLATFORMS[id]),
    }))
  );
  return results.filter((item) => item.messages.length > 0);
}

export async function writeSnapshot(
  userId: string,
  items: GatheredItems,
  connected: string[]
) {
  const record = {
    data: JSON.stringify({ items, connected }),
    updated_at: new Date().toISOString(),
  };
  try {
    const { data: existing } = await insforge.database
      .from('user_message_snapshots')
      .select('user_id')
      .eq('user_id', userId);
    if (existing && existing.length > 0) {
      await insforge.database
        .from('user_message_snapshots')
        .update(record)
        .eq('user_id', userId);
    } else {
      await insforge.database
        .from('user_message_snapshots')
        .insert([{ user_id: userId, ...record }]);
    }
  } catch {
    /* table missing — snapshot is best-effort */
  }
}

// Rough instant counts shown before the AI briefing returns (the AI overrides them).
export function computeCategoryCounts(
  items: GatheredItems
): Record<CategoryKey, number> {
  const counts: Record<CategoryKey, number> = {
    email: 0,
    messages: 0,
    mentions: 0,
    tasks: 0,
    followups: 0,
  };
  for (const item of items) {
    const isEmail = EMAIL_PLATFORMS.has(item.platform);
    for (const message of item.messages) {
      const tags = message.tags.map((tag) => tag.toUpperCase());
      const text = `${message.subject} ${message.preview}`;
      const inbound = !message.preview.startsWith('You:');
      if (isEmail) counts.email += 1;
      else counts.messages += 1;
      if (text.includes('@')) counts.mentions += 1;
      if (tags.includes('URGENT') || tags.includes('IMPORTANT'))
        counts.tasks += 1;
      if (inbound && tags.includes('UNREAD')) counts.followups += 1;
    }
  }
  return counts;
}

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  email: 'Email',
  messages: 'Messages',
  mentions: 'Mentions',
  tasks: 'Tasks',
  followups: 'Follow-ups',
};

export { CATEGORY_KEYS };
export type { CategoryKey };
