'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Bell,
  Calendar,
  CircleCheck,
  Clock,
  FileText,
  type LucideIcon,
  Mail,
  MessageCircle,
  Plug,
  RefreshCw,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { InboxMessage } from '@/lib/integration-mcp';
import { gatherItems, writeSnapshot } from '@/lib/briefing-data';
import { platformById, platformLogo, platformName } from '@/lib/integrations';
import { insforge } from '@/lib/insforge';

type Stats = { important: number; priority: number; followUps: number };
type Brief = { platform: string; title: string; summary: string; icon: string };
type Priority = {
  platform: string;
  title: string;
  time: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
};
type CachedBrief = { stats: Stats; brief: Brief[]; priorities: Priority[] };

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const briefIcons: Record<string, LucideIcon> = {
  mail: Mail,
  'message-circle': MessageCircle,
  bell: Bell,
  calendar: Calendar,
  users: Users,
  'file-text': FileText,
};

const priorityBadge: Record<Priority['priority'], string> = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-100 text-slate-600',
};

function sameSet(a: unknown, b: string[]) {
  if (!Array.isArray(a) || a.length !== b.length) return false;
  const set = new Set(a as string[]);
  return b.every((value) => set.has(value));
}

function computeStats(items: { messages: InboxMessage[] }[]): Stats {
  let important = 0;
  let priority = 0;
  let followUps = 0;
  for (const item of items) {
    for (const message of item.messages) {
      const tags = message.tags.map((tag) => tag.toUpperCase());
      const inbound = !message.preview.startsWith('You:');
      if (tags.includes('URGENT') || tags.includes('IMPORTANT')) important += 1;
      if (tags.includes('UNREAD')) priority += 1;
      if (inbound && tags.includes('UNREAD')) followUps += 1;
    }
  }
  return { important, priority, followUps };
}

export function DashboardHome() {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('Welcome back');
  const [connected, setConnected] = useState<string[]>([]);
  const [noConnections, setNoConnections] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [brief, setBrief] = useState<Brief[] | null>(null);
  const [priorities, setPriorities] = useState<Priority[] | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(true);
  const [loadingPriorities, setLoadingPriorities] = useState(true);
  const [briefError, setBriefError] = useState<string | null>(null);

  // Bumping this key re-runs the loader; forceRef marks a user-triggered refresh
  // (which bypasses the 2-hour database cache).
  const [reloadKey, setReloadKey] = useState(0);
  const forceRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const force = forceRef.current;
    forceRef.current = false;

    async function run() {
      const { data: authData } = await insforge.auth.getCurrentUser();
      const user = authData.user as {
        id: string;
        email?: string | null;
        profile?: { name?: string | null } | null;
      } | null;
      if (cancelled) return;
      if (!user) {
        setLoadingBrief(false);
        setLoadingPriorities(false);
        return;
      }
      const hour = new Date().getHours();
      setGreeting(
        hour < 12
          ? 'Good morning'
          : hour < 18
            ? 'Good afternoon'
            : 'Good evening'
      );
      setName(
        user.profile?.name?.trim() || user.email?.split('@')[0] || 'there'
      );

      const { data: rows } = await insforge.database
        .from('user_integrations')
        .select('platform, status')
        .eq('user_id', user.id);
      if (cancelled) return;
      const connectedIds = (rows ?? [])
        .filter((row) => row.status === 'connected')
        .map((row) => String(row.platform));
      setConnected(connectedIds);

      if (connectedIds.length === 0) {
        setNoConnections(true);
        setStats(null);
        setBrief(null);
        setPriorities(null);
        setLoadingBrief(false);
        setLoadingPriorities(false);
        return;
      }
      setNoConnections(false);

      // Reuse the saved brief for up to 2 hours unless the user forces a refresh.
      if (!force) {
        const cached = await readDbCache(user.id, connectedIds);
        if (cancelled) return;
        if (cached) {
          setStats(cached.stats);
          setBrief(cached.brief);
          setPriorities(cached.priorities);
          setLoadingBrief(false);
          setLoadingPriorities(false);
          return;
        }
      }

      setLoadingBrief(true);
      setLoadingPriorities(true);
      setBriefError(null);

      const items = await gatherItems(user.id, connectedIds);
      if (cancelled) return;
      void writeSnapshot(user.id, items, connectedIds);

      // Stats are computed locally so they render instantly, before the AI returns.
      const computedStats = computeStats(items);
      setStats(computedStats);

      // Brief and priorities generate in parallel and fill their cards independently.
      const briefPromise = fetchPart(items, 'brief');
      const prioritiesPromise = fetchPart(items, 'priorities');

      void briefPromise.then((result) => {
        if (cancelled) return;
        if ('error' in result) setBriefError(result.error);
        else setBrief(result.brief);
        setLoadingBrief(false);
      });
      void prioritiesPromise.then((result) => {
        if (cancelled) return;
        if (!('error' in result)) setPriorities(result.priorities);
        setLoadingPriorities(false);
      });

      void Promise.all([briefPromise, prioritiesPromise]).then(([b, p]) => {
        if (cancelled) return;
        if ('brief' in b && 'priorities' in p) {
          void writeDbCache(
            user.id,
            { stats: computedStats, brief: b.brief, priorities: p.priorities },
            connectedIds
          );
        }
      });
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

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <WelcomeHero greeting={greeting} name={name} />

      {noConnections ? (
        <EmptyState />
      ) : (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Important"
              value={stats?.important}
              icon={Star}
              color="bg-violet-500"
            />
            <StatCard
              label="Priority"
              value={stats?.priority}
              icon={Bell}
              color="bg-rose-500"
            />
            <StatCard
              label="Follow-ups"
              value={stats?.followUps}
              icon={Clock}
              color="bg-amber-400 text-amber-950"
            />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            <TodaysBrief
              items={brief}
              loading={loadingBrief}
              error={briefError}
              onRefresh={refresh}
            />
            <ConnectedAppsCard connected={connected} />
            <PriorityItemsCard items={priorities} loading={loadingPriorities} />
          </section>
        </>
      )}
    </div>
  );
}

async function fetchPart(
  items: { platform: string; messages: InboxMessage[] }[],
  part: 'brief'
): Promise<{ brief: Brief[] } | { error: string }>;
async function fetchPart(
  items: { platform: string; messages: InboxMessage[] }[],
  part: 'priorities'
): Promise<{ priorities: Priority[] } | { error: string }>;
async function fetchPart(
  items: { platform: string; messages: InboxMessage[] }[],
  part: 'brief' | 'priorities'
) {
  try {
    const response = await fetch('/api/dashboard/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, part }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      brief?: Brief[];
      priorities?: Priority[];
      error?: string;
    };
    if (!response.ok)
      return { error: data.error ?? 'Could not generate the brief.' };
    return part === 'priorities'
      ? { priorities: data.priorities ?? [] }
      : { brief: data.brief ?? [] };
  } catch {
    return { error: 'Network error while generating the brief.' };
  }
}

async function readDbCache(
  userId: string,
  ids: string[]
): Promise<CachedBrief | null> {
  try {
    const { data } = await insforge.database
      .from('dashboard_briefs')
      .select('data, platforms, updated_at')
      .eq('user_id', userId);
    const row = data?.[0] as
      { data?: string; platforms?: string; updated_at?: string } | undefined;
    if (!row?.data || !row.updated_at) return null;
    if (Date.now() - new Date(row.updated_at).getTime() > CACHE_TTL_MS)
      return null;
    if (!sameSet(JSON.parse(row.platforms ?? '[]'), ids)) return null;
    return JSON.parse(row.data) as CachedBrief;
  } catch {
    return null; // table missing or query failed — just regenerate
  }
}

async function writeDbCache(
  userId: string,
  payload: CachedBrief,
  ids: string[]
) {
  const record = {
    data: JSON.stringify(payload),
    platforms: JSON.stringify(ids),
    updated_at: new Date().toISOString(),
  };
  try {
    const { data: existing } = await insforge.database
      .from('dashboard_briefs')
      .select('user_id')
      .eq('user_id', userId);
    if (existing && existing.length > 0) {
      await insforge.database
        .from('dashboard_briefs')
        .update(record)
        .eq('user_id', userId);
    } else {
      await insforge.database
        .from('dashboard_briefs')
        .insert([{ user_id: userId, ...record }]);
    }
  } catch {
    /* table missing — caching is best-effort */
  }
}

function WelcomeHero({ greeting, name }: { greeting: string; name: string }) {
  return (
    <section className="flex flex-col justify-between gap-5 rounded-3xl bg-slate-950 p-6 text-white sm:flex-row sm:items-end sm:p-8">
      <div>
        <span className="grid size-12 place-items-center rounded-2xl bg-violet-500">
          <Sparkles size={26} aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          {greeting}
          {name ? `, ${name}` : ''}.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Here is your personalized brief across every connected workspace,
          generated just for you.
        </p>
      </div>
      <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
        Today&apos;s brief
      </span>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value?: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-5">
      <span
        className={`grid size-12 place-items-center rounded-2xl text-white ${color}`}
      >
        <Icon size={25} aria-hidden="true" />
      </span>
      <p className="mt-5 text-3xl font-bold tracking-tight">{value ?? '—'}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function PlatformTile({
  platform,
  small = false,
}: {
  platform: string;
  small?: boolean;
}) {
  const meta = platformById[platform];
  return (
    <span
      className={`grid ${small ? 'size-8' : 'size-9'} shrink-0 place-items-center overflow-hidden rounded-xl ${meta?.tileClass ?? 'bg-slate-100'}`}
    >
      <Image
        src={platformLogo(platform)}
        alt=""
        width={22}
        height={22}
        className={
          meta?.tileClass
            ? 'size-5 scale-[1.6] object-contain'
            : 'size-5 object-contain'
        }
      />
    </span>
  );
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function TodaysBrief({
  items,
  loading,
  error,
  onRefresh,
}: {
  items: Brief[] | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
      <CardHeader
        title="Today's Brief"
        subtitle="Across your connected apps"
        action={
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Regenerate brief"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      <div className="mt-4">
        {error ? (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            {error}{' '}
            <Link
              href="/integrations"
              className="font-semibold underline underline-offset-2"
            >
              Manage integrations
            </Link>
          </div>
        ) : loading && !items ? (
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="h-12 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            No brief items right now.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const Icon = briefIcons[item.icon] ?? Sparkles;
              return (
                <li
                  key={index}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <PlatformTile platform={item.platform} small />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon
                        size={14}
                        className="shrink-0 text-violet-600"
                        aria-hidden="true"
                      />
                      <p className="truncate text-sm font-bold text-slate-950">
                        {item.title}
                      </p>
                    </div>
                    <p className="mt-0.5 text-sm leading-5 text-slate-600">
                      {item.summary}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ConnectedAppsCard({ connected }: { connected: string[] }) {
  const top = connected.slice(0, 4);
  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
      <CardHeader
        title="Connected Apps"
        action={
          <Link
            href="/integrations"
            className="text-sm font-semibold text-violet-600 hover:text-violet-500"
          >
            View all
          </Link>
        }
      />
      <ul className="mt-4 space-y-2.5">
        {top.length === 0 ? (
          <li className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            No apps connected yet.
          </li>
        ) : (
          top.map((id) => (
            <li
              key={id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3"
            >
              <PlatformTile platform={id} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950">
                  {platformName(id)}
                </p>
                <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CircleCheck size={13} aria-hidden="true" />
                  Connected
                </span>
              </div>
              <Link
                href="/integrations"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Manage
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function PriorityItemsCard({
  items,
  loading,
}: {
  items: Priority[] | null;
  loading: boolean;
}) {
  const top = (items ?? []).slice(0, 4);
  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
      <CardHeader title="Priority Items" />
      <ul className="mt-4 space-y-3">
        {loading && !items ? (
          [0, 1, 2].map((row) => (
            <li
              key={row}
              className="h-16 animate-pulse rounded-2xl bg-slate-100"
            />
          ))
        ) : top.length === 0 ? (
          <li className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Nothing needs your attention right now.
          </li>
        ) : (
          top.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5"
            >
              <PlatformTile platform={item.platform} small />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {item.title}
                  </p>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${priorityBadge[item.priority]}`}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-slate-400">
                  {item.time}
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {item.context}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="dashboard-card mt-6 grid place-items-center rounded-3xl border border-slate-200 bg-white p-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-violet-500 text-white">
        <Plug size={28} aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-xl font-bold tracking-tight">
        Connect an app to get your brief
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        Link Gmail and your other tools so OmniMind can gather today&apos;s
        messages and generate a personalized brief for you.
      </p>
      <Link
        href="/integrations"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400 active:translate-y-px"
      >
        Go to Integrations
        <ArrowUpRight size={17} aria-hidden="true" />
      </Link>
    </div>
  );
}
