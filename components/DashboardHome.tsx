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
import { useEffect, useState } from 'react';
import { getMcpConfig, type InboxMessage } from '@/lib/integration-mcp';
import { platformById, platformLogo, platformName } from '@/lib/integrations';
import { insforge } from '@/lib/insforge';

type Brief = { platform: string; title: string; summary: string; icon: string };
type Priority = {
  platform: string;
  title: string;
  time: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
};
type BriefResult = {
  stats: { important: number; priority: number; followUps: number };
  brief: Brief[];
  priorities: Priority[];
};

const STALE_MS = 10 * 60 * 1000;

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

export function DashboardHome() {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('Welcome back');
  const [connected, setConnected] = useState<string[]>([]);
  const [result, setResult] = useState<BriefResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noConnections, setNoConnections] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(force: boolean) {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    );

    const { data: authData } = await insforge.auth.getCurrentUser();
    const user = authData.user as {
      id: string;
      email?: string | null;
      profile?: { name?: string | null } | null;
    } | null;
    if (!user) {
      setLoading(false);
      return;
    }
    setName(user.profile?.name?.trim() || user.email?.split('@')[0] || 'there');

    const { data: rows } = await insforge.database
      .from('user_integrations')
      .select('platform, status')
      .eq('user_id', user.id);
    const connectedIds = (rows ?? [])
      .filter((row) => row.status === 'connected')
      .map((row) => String(row.platform));
    setConnected(connectedIds);

    if (connectedIds.length === 0) {
      setNoConnections(true);
      setResult(null);
      setLoading(false);
      return;
    }
    setNoConnections(false);

    const cacheKey = `dash_brief_${user.id}`;
    if (!force) {
      const cached = readCache(cacheKey, connectedIds);
      if (cached) {
        setResult(cached);
        setError(null);
        setLoading(false);
        return;
      }
    }

    setRefreshing(true);
    const items = await gatherItems(user.id, connectedIds);

    try {
      const response = await fetch('/api/dashboard/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = (await response.json().catch(() => ({}))) as BriefResult & {
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? 'Could not generate the brief.');
        setResult(null);
      } else {
        setResult(data);
        setError(null);
        writeCache(cacheKey, data, connectedIds);
      }
    } catch {
      setError('Network error while generating the brief.');
    }
    setRefreshing(false);
    setLoading(false);
  }

  const busy = loading || refreshing;

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
              value={result?.stats.important}
              loading={busy}
              icon={Star}
              color="bg-violet-500"
            />
            <StatCard
              label="Priority"
              value={result?.stats.priority}
              loading={busy}
              icon={Bell}
              color="bg-rose-500"
            />
            <StatCard
              label="Follow-ups"
              value={result?.stats.followUps}
              loading={busy}
              icon={Clock}
              color="bg-amber-400 text-amber-950"
            />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <TodaysBrief
              items={result?.brief ?? []}
              loading={busy}
              error={error}
              onRefresh={() => void load(true)}
            />
            <div className="space-y-4">
              <ConnectedAppsCard connected={connected} />
              <PriorityItemsCard
                items={result?.priorities ?? []}
                loading={busy}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );

  async function gatherItems(userId: string, connectedIds: string[]) {
    const items: { platform: string; messages: InboxMessage[] }[] = [];
    for (const id of connectedIds) {
      let messages: InboxMessage[] = [];
      if (id === 'gmail') messages = await fetchMessages('/api/gmail/messages');
      else if (id === 'whatsapp')
        messages = await fetchMessages(
          `/api/whatsapp/messages?userId=${encodeURIComponent(userId)}`
        );
      else messages = getMcpConfig(id).messages;
      if (messages.length) items.push({ platform: id, messages });
    }
    return items;
  }
}

async function fetchMessages(url: string): Promise<InboxMessage[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = (await response.json()) as { messages?: InboxMessage[] };
    return data.messages ?? [];
  } catch {
    return [];
  }
}

function readCache(key: string, ids: string[]): BriefResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const cached = JSON.parse(raw) as {
      ts: number;
      data: BriefResult;
      platforms: string[];
    };
    if (Date.now() - cached.ts > STALE_MS) return null;
    if (!sameSet(cached.platforms, ids)) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: BriefResult, ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ ts: Date.now(), data, platforms: ids })
    );
  } catch {
    /* storage unavailable */
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
  loading,
  icon: Icon,
  color,
}: {
  label: string;
  value?: number;
  loading: boolean;
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
      <p className="mt-5 text-3xl font-bold tracking-tight">
        {loading && value === undefined ? '—' : (value ?? 0)}
      </p>
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

function TodaysBrief({
  items,
  loading,
  error,
  onRefresh,
}: {
  items: Brief[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-violet-500 text-white">
            <Sparkles size={20} aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              Today&apos;s Brief
            </h3>
            <p className="text-sm text-slate-500">Across your connected apps</p>
          </div>
        </div>
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
      </div>

      <div className="mt-5 space-y-3">
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
        ) : loading ? (
          [0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-16 animate-pulse rounded-2xl bg-slate-100"
            />
          ))
        ) : items.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            No brief items right now. Check back after new messages arrive.
          </p>
        ) : (
          items.map((item, index) => {
            const Icon = briefIcons[item.icon] ?? Sparkles;
            return (
              <div
                key={index}
                className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
              >
                <PlatformTile platform={item.platform} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon
                      size={15}
                      className="shrink-0 text-violet-600"
                      aria-hidden="true"
                    />
                    <p className="truncate text-sm font-bold text-slate-950">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {item.summary}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ConnectedAppsCard({ connected }: { connected: string[] }) {
  const top = connected.slice(0, 4);
  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-tight">Connected Apps</h3>
        <Link
          href="/integrations"
          className="text-sm font-semibold text-violet-600 hover:text-violet-500"
        >
          View all
        </Link>
      </div>
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
  items: Priority[];
  loading: boolean;
}) {
  const top = items.slice(0, 4);
  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-bold tracking-tight">Priority Items</h3>
      <ul className="mt-4 space-y-3">
        {loading ? (
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
        Link Gmail, WhatsApp, and more so OmniMind can gather today&apos;s
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
