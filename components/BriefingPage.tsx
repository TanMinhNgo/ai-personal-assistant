'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  AtSign,
  Clock,
  ListChecks,
  type LucideIcon,
  Mail,
  MessageCircle,
  Plug,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CustomBriefingDialog } from '@/components/CustomBriefingDialog';
import {
  CATEGORY_KEYS,
  type BriefingResult,
  type CategoryKey,
} from '@/lib/briefing-ai';
import { computeCategoryCounts, gatherItems, type GatheredItems, writeSnapshot } from '@/lib/briefing-data';
import { computeNextRun, type Frequency } from '@/lib/briefing-schedule';
import { platformById, platformLogo, platformName } from '@/lib/integrations';
import { insforge } from '@/lib/insforge';

type StoredBriefing = { id: string; kind: string; title: string; created_at: string };

const CATEGORY_META: Record<CategoryKey, { label: string; icon: LucideIcon; color: string }> = {
  email: { label: 'Email', icon: Mail, color: 'bg-violet-500' },
  messages: { label: 'Messages', icon: MessageCircle, color: 'bg-emerald-500' },
  mentions: { label: 'Mentions', icon: AtSign, color: 'bg-sky-500' },
  tasks: { label: 'Tasks', icon: ListChecks, color: 'bg-amber-400 text-amber-950' },
  followups: { label: 'Follow-ups', icon: Clock, color: 'bg-rose-500' },
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function BriefingPage() {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState<string[]>([]);
  const [noConnections, setNoConnections] = useState(false);
  const [result, setResult] = useState<BriefingResult | null>(null);
  const [instantCounts, setInstantCounts] = useState<Record<CategoryKey, number> | null>(null);
  const [items, setItems] = useState<GatheredItems>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [past, setPast] = useState<StoredBriefing[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const forceRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const force = forceRef.current;
    forceRef.current = false;

    async function run() {
      const { data: authData } = await insforge.auth.getCurrentUser();
      const user = authData.user as { id: string; email?: string | null; profile?: { name?: string | null } | null } | null;
      if (cancelled || !user) {
        if (!cancelled) setLoading(false);
        return;
      }
      setName(user.profile?.name?.trim() || user.email?.split('@')[0] || 'there');
      setUserId(user.id);

      const { data: rows } = await insforge.database.from('user_integrations').select('platform, status').eq('user_id', user.id);
      const connectedIds = (rows ?? []).filter((row) => row.status === 'connected').map((row) => String(row.platform));
      if (cancelled) return;
      setConnected(connectedIds);

      void loadPast(user.id);

      if (connectedIds.length === 0) {
        setNoConnections(true);
        setResult(null);
        setLoading(false);
        return;
      }
      setNoConnections(false);
      setLoading(true);
      setError(null);

      const gathered = await gatherItems(user.id, connectedIds);
      if (cancelled) return;
      setItems(gathered);
      setInstantCounts(computeCategoryCounts(gathered));
      void writeSnapshot(user.id, gathered, connectedIds);

      // Fire any overdue custom schedules so they appear even without the cron.
      void runDueSchedules(user.id, gathered).then((ran) => {
        if (!cancelled && ran) void loadPast(user.id);
      });

      const cachedToday = force ? null : await readTodayDaily(user.id);
      if (cachedToday && !cancelled) {
        setResult(cachedToday);
        setLoading(false);
        return;
      }

      const generated = await generateBriefing(gathered);
      if (cancelled) return;
      if ('error' in generated) {
        setError(generated.error);
      } else {
        setResult(generated);
        void persistDaily(user.id, generated, gathered);
      }
      setLoading(false);
    }

    async function loadPast(uid: string) {
      try {
        const { data } = await insforge.database
          .from('briefings')
          .select('id, kind, title, created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false });
        if (cancelled) return;
        setPast(((data ?? []) as StoredBriefing[]).filter((row) => row.kind !== 'daily').slice(0, 8));
      } catch {
        /* table missing */
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = () => {
    forceRef.current = true;
    setReloadKey((key) => key + 1);
  };
  const reload = () => setReloadKey((key) => key + 1);

  const categoryFor = (key: CategoryKey) => result?.categories.find((category) => category.key === key);

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <section className="flex flex-col justify-between gap-5 rounded-3xl bg-slate-950 p-6 text-white sm:flex-row sm:items-end sm:p-8">
        <div>
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-400 text-amber-950">
            <ListChecks size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Your briefings{name ? `, ${name}` : ''}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            A daily digest of what matters across your connected apps, plus the custom briefings you schedule.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400 active:translate-y-px"
        >
          <Plus size={18} aria-hidden="true" />
          Create custom briefing
        </button>
      </section>

      {noConnections ? (
        <EmptyState />
      ) : (
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
          <TodaysBriefingCard result={result} items={items} loading={loading} error={error} onRefresh={refresh} />
          <CategoriesCard categoryFor={categoryFor} instantCounts={instantCounts} loading={loading} />
          <ScheduledCard past={past} />
        </section>
      )}

      {dialogOpen && userId && (
        <CustomBriefingDialog
          userId={userId}
          connected={connected}
          items={items}
          onClose={() => setDialogOpen(false)}
          onCreated={() => {
            setDialogOpen(false);
            reload();
          }}
        />
      )}
    </div>
  );

  async function runDueSchedules(uid: string, gathered: GatheredItems): Promise<boolean> {
    try {
      const { data } = await insforge.database.from('briefing_schedules').select('*').eq('user_id', uid);
      const now = Date.now();
      const due = (data ?? []).filter((row) => row.enabled && new Date(String(row.next_run_at)).getTime() <= now);
      if (due.length === 0) return false;
      for (const row of due) {
        const categories = parseJson<string[]>(row.categories, []);
        const generated = await generateBriefing(gathered, String(row.description ?? ''), categories);
        if ('error' in generated) continue;
        await insforge.database.from('briefings').insert([
          {
            user_id: uid,
            kind: 'scheduled',
            title: String(row.name ?? 'Briefing'),
            data: JSON.stringify({ ...generated, items: gathered }),
            schedule_id: row.id,
            created_at: new Date().toISOString(),
          },
        ]);
        const next = computeNextRun((row.frequency as Frequency) ?? 'daily', String(row.scheduled_time ?? '08:00'));
        await insforge.database.from('briefing_schedules').update({ next_run_at: next.toISOString() }).eq('id', row.id);
      }
      return true;
    } catch {
      return false;
    }
  }
}

async function generateBriefing(items: GatheredItems, goal?: string, categories?: string[]): Promise<BriefingResult | { error: string }> {
  try {
    const response = await fetch('/api/briefing/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, goal, categories }),
    });
    const data = (await response.json().catch(() => ({}))) as BriefingResult & { error?: string };
    if (!response.ok) return { error: data.error ?? 'Could not generate the briefing.' };
    return data;
  } catch {
    return { error: 'Network error while generating the briefing.' };
  }
}

async function readTodayDaily(userId: string): Promise<BriefingResult | null> {
  try {
    const { data } = await insforge.database
      .from('briefings')
      .select('data, created_at')
      .eq('user_id', userId)
      .eq('kind', 'daily')
      .order('created_at', { ascending: false });
    const row = (data ?? [])[0] as { data?: unknown; created_at?: string } | undefined;
    if (!row?.created_at) return null;
    if (new Date(row.created_at).toDateString() !== new Date().toDateString()) return null;
    const parsed = parseJson<{ top?: BriefingResult['top']; categories?: BriefingResult['categories'] }>(row.data, {});
    if (!parsed.top) return null;
    return { top: parsed.top, categories: parsed.categories ?? [] };
  } catch {
    return null;
  }
}

async function persistDaily(userId: string, result: BriefingResult, items: GatheredItems) {
  const record = {
    kind: 'daily',
    title: result.top.title,
    data: JSON.stringify({ ...result, items }),
    created_at: new Date().toISOString(),
  };
  try {
    const { data } = await insforge.database
      .from('briefings')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('kind', 'daily')
      .order('created_at', { ascending: false });
    const latest = (data ?? [])[0] as { id: string; created_at: string } | undefined;
    if (latest && new Date(latest.created_at).toDateString() === new Date().toDateString()) {
      await insforge.database.from('briefings').update(record).eq('id', latest.id);
    } else {
      await insforge.database.from('briefings').insert([{ user_id: userId, ...record }]);
    }
  } catch {
    /* table missing */
  }
}

function TodaysBriefingCard({ result, items, loading, error, onRefresh }: { result: BriefingResult | null; items: GatheredItems; loading: boolean; error: string | null; onRefresh: () => void }) {
  const listing = items.flatMap((item) => item.messages.map((message) => ({ platform: item.platform, message }))).slice(0, 6);

  return (
    <section className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-violet-500 text-white">
            <Sparkles size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wider text-violet-600">TODAY&apos;S BRIEFING</p>
            <h3 className="text-lg font-bold tracking-tight">{result?.top.title ?? (loading ? 'Generating…' : 'Your briefing')}</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Regenerate briefing"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          {error}{' '}
          <Link href="/integrations" className="font-semibold underline underline-offset-2">
            Manage integrations
          </Link>
        </div>
      ) : (
        <>
          {(result?.top.summary || loading) && (
            <p className="mt-4 text-sm leading-6 text-slate-600">{result?.top.summary ?? 'Scanning your connected apps…'}</p>
          )}

          <ul className="mt-4 divide-y divide-slate-100">
            {loading && listing.length === 0 ? (
              [0, 1, 2].map((row) => <li key={row} className="h-12 animate-pulse rounded-xl bg-slate-100" />)
            ) : listing.length === 0 ? (
              <li className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No items to brief right now.</li>
            ) : (
              listing.map((entry, index) => (
                <li key={index} className="flex items-start gap-3 py-3 first:pt-0">
                  <span className={`grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl ${platformById[entry.platform]?.tileClass ?? 'bg-slate-100'}`}>
                    <Image src={platformLogo(entry.platform)} alt="" width={20} height={20} className="size-5 object-contain" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-950">{entry.message.sender}</p>
                      <span className="shrink-0 text-xs text-slate-400">{entry.message.time}</span>
                    </div>
                    <p className="truncate text-sm text-slate-600">{entry.message.subject}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">{platformName(entry.platform)}</p>
                  </div>
                </li>
              ))
            )}
          </ul>

          <Link href="/briefing/today" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-500">
            Open full briefing
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </>
      )}
    </section>
  );
}

function CategoriesCard({ categoryFor, instantCounts, loading }: { categoryFor: (key: CategoryKey) => BriefingResult['categories'][number] | undefined; instantCounts: Record<CategoryKey, number> | null; loading: boolean }) {
  return (
    <section className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-bold tracking-tight">Categories</h3>
      <p className="text-sm text-slate-500">Grouped across your connected apps.</p>
      <div className="mt-4 grid gap-2.5">
        {CATEGORY_KEYS.map((key) => {
          const meta = CATEGORY_META[key];
          const category = categoryFor(key);
          const count = category?.count ?? instantCounts?.[key] ?? 0;
          const summary = category?.summary ?? (loading ? 'Scanning…' : 'Nothing new here.');
          return (
            <Link
              key={key}
              href={`/briefing/today?category=${key}`}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-violet-300 hover:bg-slate-50"
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-white ${meta.color}`}>
                <meta.icon size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-950">{meta.label}</p>
                  <span className="text-lg font-bold tracking-tight">{count}</span>
                </div>
                <p className="truncate text-xs text-slate-500">{summary}</p>
              </div>
              <ArrowUpRight size={15} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ScheduledCard({ past }: { past: StoredBriefing[] }) {
  return (
    <section className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-bold tracking-tight">Scheduled briefings</h3>
      <p className="text-sm text-slate-500">Generated from your saved schedules.</p>
      <ul className="mt-4 space-y-2.5">
        {past.length === 0 ? (
          <li className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No scheduled briefings yet. Create one to receive them automatically.</li>
        ) : (
          past.map((row) => (
            <li key={row.id}>
              <Link href={`/briefing/${row.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3.5 transition hover:bg-slate-50">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <Sparkles size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-950">{row.title || 'Briefing'}</p>
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold uppercase text-slate-500">{row.kind}</span> · {relativeTime(row.created_at)}
                  </p>
                </div>
                <ArrowUpRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="dashboard-card mt-6 grid place-items-center rounded-3xl border border-slate-200 bg-white p-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-violet-500 text-white">
        <Plug size={28} aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-xl font-bold tracking-tight">Connect an app to get briefings</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Link Gmail and your other tools so OmniMind can gather today&apos;s activity and brief you on what matters.</p>
      <Link href="/integrations" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400 active:translate-y-px">
        Go to Integrations
        <ArrowUpRight size={17} aria-hidden="true" />
      </Link>
    </div>
  );
}
