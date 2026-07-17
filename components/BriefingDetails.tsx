'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, LoaderCircle, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { BriefingResult, CategoryKey } from '@/lib/briefing-ai';
import { CATEGORY_KEYS, CATEGORY_LABELS, gatherItems, type GatheredItems } from '@/lib/briefing-data';
import { platformById, platformLogo, platformName } from '@/lib/integrations';
import type { InboxMessage } from '@/lib/integration-mcp';
import { insforge } from '@/lib/insforge';

type FlatItem = { platform: string; message: InboxMessage; categories: CategoryKey[] };
const EMAIL_PLATFORMS = new Set(['gmail', 'outlook']);

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function classify(platform: string, message: InboxMessage): CategoryKey[] {
  const cats: CategoryKey[] = [EMAIL_PLATFORMS.has(platform) ? 'email' : 'messages'];
  const tags = message.tags.map((tag) => tag.toUpperCase());
  const text = `${message.subject} ${message.preview}`;
  if (text.includes('@')) cats.push('mentions');
  if (tags.includes('URGENT') || tags.includes('IMPORTANT')) cats.push('tasks');
  if (!message.preview.startsWith('You:') && tags.includes('UNREAD')) cats.push('followups');
  return cats;
}

function flatten(items: GatheredItems): FlatItem[] {
  return items.flatMap((item) => item.messages.map((message) => ({ platform: item.platform, message, categories: classify(item.platform, message) })));
}

async function generateTop(items: GatheredItems): Promise<BriefingResult['top'] | null> {
  if (items.length === 0) return null;
  try {
    const response = await fetch('/api/briefing/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { top?: BriefingResult['top'] };
    return data.top ?? null;
  } catch {
    return null;
  }
}

export function BriefingDetails({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') as CategoryKey | null;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Briefing');
  const [top, setTop] = useState<BriefingResult['top'] | null>(null);
  const [flat, setFlat] = useState<FlatItem[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'all'>(categoryParam ?? 'all');
  const [compose, setCompose] = useState<FlatItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const { data: authData } = await insforge.auth.getCurrentUser();
      const user = authData.user as { id: string } | null;
      if (cancelled) return;

      // "today" is always rendered from live data so it works even when the daily
      // briefing was never persisted (e.g. opened directly or DB not set up).
      if (id === 'today') {
        setTitle('Today’s briefing');
        let connectedIds: string[] = [];
        let storedTop: BriefingResult['top'] | null = null;
        if (user) {
          const { data: rows } = await insforge.database.from('user_integrations').select('platform, status').eq('user_id', user.id);
          connectedIds = (rows ?? []).filter((row) => row.status === 'connected').map((row) => String(row.platform));
          try {
            const { data } = await insforge.database.from('briefings').select('data, created_at').eq('user_id', user.id).eq('kind', 'daily').order('created_at', { ascending: false });
            const row = (data ?? [])[0] as { data?: unknown; created_at?: string } | undefined;
            if (row?.created_at && new Date(row.created_at).toDateString() === new Date().toDateString()) {
              storedTop = parseJson<{ top?: BriefingResult['top'] }>(row.data, {}).top ?? null;
            }
          } catch {
            /* table missing — fall back to live generation */
          }
        }
        const items = user ? await gatherItems(user.id, connectedIds) : [];
        if (cancelled) return;
        setFlat(flatten(items));
        setTop(storedTop ?? (await generateTop(items)));
        if (!cancelled) setLoading(false);
        return;
      }

      // A specific stored briefing (scheduled / custom) — load it by id.
      try {
        const { data } = await insforge.database.from('briefings').select('title, data, created_at').eq('id', id);
        const row = (data ?? [])[0] as { title?: string; data?: unknown } | undefined;
        if (cancelled) return;
        if (row) {
          const parsed = parseJson<{ top?: BriefingResult['top']; items?: GatheredItems }>(row.data, {});
          setTitle(row.title || 'Briefing');
          setTop(parsed.top ?? null);
          setFlat(flatten(parsed.items ?? []));
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
      if (!cancelled) setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const filtered = useMemo(() => (activeCategory === 'all' ? flat : flat.filter((entry) => entry.categories.includes(activeCategory))), [flat, activeCategory]);

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <Link href="/briefing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-950">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to briefings
      </Link>

      {notFound ? (
        <div className="dashboard-card mt-4 grid place-items-center rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Sparkles size={28} aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-xl font-bold tracking-tight">Briefing not found</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">This briefing may have been removed, or the database isn&apos;t set up yet. Head back and open today&apos;s briefing instead.</p>
          <Link href="/briefing" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400">
            Back to briefings
          </Link>
        </div>
      ) : (
      <>
      <section className="mt-4 rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-violet-500">
          <Sparkles size={26} aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">{top?.title ?? title}</h2>
        {top?.summary && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{top.summary}</p>}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap gap-2">
            <FilterTab label="All" active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
            {CATEGORY_KEYS.map((key) => (
              <FilterTab key={key} label={CATEGORY_LABELS[key]} active={activeCategory === key} onClick={() => setActiveCategory(key)} />
            ))}
          </div>

          <ul className="mt-5 space-y-3">
            {loading ? (
              [0, 1, 2].map((row) => <li key={row} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)
            ) : filtered.length === 0 ? (
              <li className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                {flat.length === 0 ? (
                  <>No items to show yet. <Link href="/integrations" className="font-semibold text-violet-600 underline underline-offset-2">Connect an app</Link> to populate your briefing.</>
                ) : (
                  'Nothing in this category.'
                )}
              </li>
            ) : (
              filtered.map((entry, index) => {
                const meta = platformById[entry.platform];
                return (
                  <li key={index} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className={`grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl ${meta?.tileClass ?? 'bg-slate-100'}`}>
                        <Image src={platformLogo(entry.platform)} alt="" width={20} height={20} className="size-5 object-contain" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-slate-950">{entry.message.sender}</p>
                          <span className="shrink-0 text-xs text-slate-400">{entry.message.time}</span>
                        </div>
                        <p className="truncate text-sm font-semibold text-slate-700">{entry.message.subject}</p>
                        <p className="mt-1 text-sm leading-5 text-slate-600">{entry.message.body.join(' ').slice(0, 240)}</p>
                        <button
                          type="button"
                          onClick={() => setCompose(entry)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
                        >
                          <Send size={13} aria-hidden="true" />
                          {EMAIL_PLATFORMS.has(entry.platform) ? 'Reply by email' : 'Reply with message'}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <ComposePanel target={compose} topSummary={top?.summary ?? ''} onClose={() => setCompose(null)} />
      </div>
      </>
      )}
    </div>
  );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${active ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
    >
      {label}
    </button>
  );
}

function ComposePanel({ target, topSummary, onClose }: { target: FlatItem | null; topSummary: string; onClose: () => void }) {
  const isEmail = target ? EMAIL_PLATFORMS.has(target.platform) : true;
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [goal, setGoal] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const lastTarget = useRef<string | null>(null);

  // Reset the composer when a new item is selected.
  const targetKey = target ? `${target.platform}:${target.message.id}` : null;
  if (targetKey !== lastTarget.current) {
    lastTarget.current = targetKey;
    setSubject(target && EMAIL_PLATFORMS.has(target.platform) ? `Re: ${target.message.subject}` : '');
    setBody('');
    setGoal('');
    setStatus(null);
  }

  if (!target) {
    return (
      <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-bold tracking-tight">Compose</h3>
        <p className="mt-2 text-sm text-slate-500">Pick an item and choose reply to draft and send a response with AI help.</p>
      </div>
    );
  }

  const recipient = isEmail ? target.message.handle : target.message.sender;

  async function aiDraft() {
    setDrafting(true);
    setStatus(null);
    try {
      const response = await fetch('/api/briefing/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: isEmail ? 'email' : 'message',
          context: `${topSummary}\n\n${target?.message.body.join(' ')}`,
          recipient,
          goal,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { draft?: string; error?: string };
      if (!response.ok) setStatus({ kind: 'error', text: data.error ?? 'Could not draft.' });
      else setBody(data.draft ?? '');
    } catch {
      setStatus({ kind: 'error', text: 'Network error while drafting.' });
    }
    setDrafting(false);
  }

  async function send() {
    if (!body.trim()) {
      setStatus({ kind: 'error', text: 'Write or draft a message first.' });
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      if (!isEmail) {
        // Only email has a real send channel; copy the draft for other platforms.
        await navigator.clipboard?.writeText(body).catch(() => {});
        setStatus({ kind: 'ok', text: 'Draft copied — paste it into the app to send.' });
        setSending(false);
        return;
      }
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient, subject, body }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (response.ok && data.ok) setStatus({ kind: 'ok', text: 'Sent successfully.' });
      else setStatus({ kind: 'error', text: data.error ?? 'Could not send.' });
    } catch {
      setStatus({ kind: 'error', text: 'Network error while sending.' });
    }
    setSending(false);
  }

  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-tight">{isEmail ? 'Reply by email' : 'Reply with message'}</h3>
        <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100" aria-label="Close composer">
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        To <span className="font-semibold text-slate-700">{recipient}</span> · via {platformName(target.platform)}
      </p>

      <div className="mt-4 space-y-3">
        {isEmail && <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" className={inputClass} />}
        <input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="What do you want to say? (for AI draft)" className={inputClass} />
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={6} placeholder="Write your message, or use AI draft…" className={inputClass} />
        {status && <p className={`rounded-xl px-4 py-2.5 text-sm ${status.kind === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{status.text}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => void aiDraft()}
            disabled={drafting}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {drafting ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            AI draft
          </button>
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-400 disabled:opacity-60"
          >
            {sending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus-visible:ring-2 focus-visible:ring-violet-500/30';
