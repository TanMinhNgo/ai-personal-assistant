import { logger, schedules, task } from '@trigger.dev/sdk/v3';
import { createClient } from '@insforge/sdk';
import { GoogleGenAI } from '@google/genai';
import { briefingSchema, buildBriefingPrompt, type BriefingItems } from '../lib/briefing-ai';
import { computeNextRun, type Frequency } from '../lib/briefing-schedule';

// The task runs in a separate process from Next.js, so it builds its own InsForge
// client from explicit env (never imports lib/insforge, which throws at load).
// A service key bypasses RLS so the cron can see every user's schedules.
function db() {
  const baseUrl = process.env.INSFORGE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_URL;
  const key = process.env.INSFORGE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!baseUrl || !key) throw new Error('Missing INSFORGE_URL / key env for the briefing task.');
  return createClient({ baseUrl, anonKey: key });
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

type GeneratePayload = { scheduleId: string; userId: string };

// Generate one briefing from the user's latest snapshot and store it.
export const generateBriefing = task({
  id: 'generate-briefing',
  run: async (payload: GeneratePayload) => {
    const client = db();

    const { data: scheduleRows } = await client.database.from('briefing_schedules').select('*').eq('id', payload.scheduleId);
    const schedule = (scheduleRows ?? [])[0];
    if (!schedule || !schedule.enabled) return { skipped: true };

    const { data: snapshotRows } = await client.database.from('user_message_snapshots').select('data').eq('user_id', payload.userId);
    const rawSnapshot = (snapshotRows ?? [])[0]?.data;
    const snapshot = (typeof rawSnapshot === 'string' ? JSON.parse(rawSnapshot) : rawSnapshot) ?? {};
    const items = (snapshot.items ?? []) as BriefingItems;

    let result: Record<string, unknown> = { top: { title: 'No new activity', summary: 'No fresh items in the latest snapshot.', highlights: [] }, categories: [] };
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && items.length > 0) {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite',
        contents: buildBriefingPrompt(items, String(schedule.description ?? ''), asArray(schedule.categories)),
        config: { responseMimeType: 'application/json', responseSchema: briefingSchema, maxOutputTokens: 900, temperature: 0.3 },
      });
      result = JSON.parse(response.text ?? '{}');
    }

    await client.database.from('briefings').insert([
      {
        user_id: payload.userId,
        kind: 'scheduled',
        title: String(schedule.name ?? 'Briefing'),
        data: JSON.stringify({ ...result, items }),
        schedule_id: payload.scheduleId,
        created_at: new Date().toISOString(),
      },
    ]);

    logger.info('briefing generated', { userId: payload.userId, scheduleId: payload.scheduleId });
    return { ok: true };
  },
});

// Every 15 minutes: enqueue any schedule due within the next window, then advance
// its next_run_at so it isn't enqueued twice.
export const scanBriefingSchedules = schedules.task({
  id: 'scan-briefing-schedules',
  cron: '*/15 * * * *',
  run: async () => {
    const client = db();
    const horizon = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data } = await client.database
      .from('briefing_schedules')
      .select('id, user_id, frequency, scheduled_time, next_run_at')
      .eq('enabled', true)
      .lte('next_run_at', horizon);

    const rows = (data ?? []) as { id: string; user_id: string; frequency: string; scheduled_time: string }[];
    if (rows.length === 0) {
      logger.info('no due briefing schedules');
      return { enqueued: 0 };
    }

    await generateBriefing.batchTrigger(rows.map((row) => ({ payload: { scheduleId: row.id, userId: row.user_id } })));

    for (const row of rows) {
      const next = computeNextRun((row.frequency as Frequency) ?? 'daily', row.scheduled_time ?? '08:00');
      await client.database.from('briefing_schedules').update({ next_run_at: next.toISOString() }).eq('id', row.id);
    }

    logger.info('enqueued briefings', { count: rows.length });
    return { enqueued: rows.length };
  },
});
