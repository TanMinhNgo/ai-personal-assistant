'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Brain,
  ListChecks,
  Mail,
  PenLine,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Markdown } from '@/components/Markdown';
import type { BriefingResult } from '@/lib/briefing-ai';
import { gatherItems, type GatheredItems } from '@/lib/briefing-data';
import { platformLogo, platformName } from '@/lib/integrations';
import { insforge } from '@/lib/insforge';

type ChatRole = 'user' | 'assistant';
type Message = {
  id: string;
  role: ChatRole;
  content: string;
  sources?: string[];
  pending?: boolean;
};
type StoredChat = { savedAt: number; messages: Message[] };

const DAY_MS = 24 * 60 * 60 * 1000;
const storageKey = (uid: string) => `omnimind:ai-agent:${uid}`;

const STARTERS = [
  { icon: Sparkles, text: 'Summarize my latest updates' },
  { icon: ListChecks, text: 'What needs my attention today?' },
  { icon: PenLine, text: 'Draft a reply to my newest email' },
  { icon: Mail, text: 'List action items from my inbox' },
];

function loadHistory(uid: string): Message[] {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredChat;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > DAY_MS) {
      localStorage.removeItem(storageKey(uid));
      return [];
    }
    return parsed.messages ?? [];
  } catch {
    return [];
  }
}

function saveHistory(uid: string, messages: Message[]) {
  try {
    localStorage.setItem(
      storageKey(uid),
      JSON.stringify({ savedAt: Date.now(), messages } satisfies StoredChat)
    );
  } catch {
    /* quota / private mode */
  }
}

function buildContext(items: GatheredItems): string {
  if (!items.length) return '';
  return items
    .map((group) => {
      const lines = group.messages
        .slice(0, 8)
        .map(
          (message) =>
            `- [${message.tags.join(',') || 'none'}] ${message.sender} <${message.handle}>: ${message.subject} — ${message.preview}`
        )
        .join('\n');
      return `## ${platformName(group.platform)} (${group.platform})\n${lines}`;
    })
    .join('\n\n');
}

export function AiAgentPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState<string[]>([]);
  const [items, setItems] = useState<GatheredItems>([]);
  const [context, setContext] = useState('');
  const [gathering, setGathering] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const { data: authData } = await insforge.auth.getCurrentUser();
      const user = authData.user as { id: string } | null;
      if (cancelled || !user) {
        if (!cancelled) setGathering(false);
        return;
      }
      setUserId(user.id);
      const restored = loadHistory(user.id);
      if (restored.length) setMessages(restored);

      const { data: rows } = await insforge.database
        .from('user_integrations')
        .select('platform, status')
        .eq('user_id', user.id);
      const connectedIds = (rows ?? [])
        .filter((row) => row.status === 'connected')
        .map((row) => String(row.platform));
      if (cancelled) return;
      setConnected(connectedIds);

      if (connectedIds.length === 0) {
        setGathering(false);
        return;
      }
      setGathering(true);
      const gathered = await gatherItems(user.id, connectedIds);
      if (cancelled) return;
      setItems(gathered);
      setContext(buildContext(gathered));
      setGathering(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Persist history (write-only effect, 1-day sliding window).
  useEffect(() => {
    if (userId && messages.length) saveHistory(userId, messages);
  }, [userId, messages]);

  // Auto-scroll to the latest message (DOM-only effect).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };
    const aiId = crypto.randomUUID();
    const sources = items.map((item) => item.platform);
    const aiMessage: Message = {
      id: aiId,
      role: 'assistant',
      content: '',
      sources,
      pending: true,
    };
    const history = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setSuggestions([]);
    setStreaming(true);

    try {
      const response = await fetch('/api/ai-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, context }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response
          .text()
          .catch(() => 'The assistant is unavailable.');
        setMessages((prev) =>
          prev.map((message) =>
            message.id === aiId
              ? { ...message, content: errorText, pending: false }
              : message
          )
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const current = accumulated;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === aiId ? { ...message, content: current } : message
          )
        );
      }
      setMessages((prev) =>
        prev.map((message) =>
          message.id === aiId ? { ...message, pending: false } : message
        )
      );
      void fetchSuggestions(trimmed, accumulated);
    } catch {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === aiId
            ? {
                ...message,
                content: 'Network error. Please try again.',
                pending: false,
              }
            : message
        )
      );
    } finally {
      setStreaming(false);
    }
  }

  async function fetchSuggestions(question: string, answer: string) {
    if (!answer.trim()) return;
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai-agent/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        suggestions?: string[];
      };
      setSuggestions(data.suggestions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setSuggestions([]);
    if (userId) {
      try {
        localStorage.removeItem(storageKey(userId));
      } catch {
        /* ignore */
      }
    }
    setReloadKey((key) => key + 1);
  }

  const isEmpty = messages.length === 0;
  const summarySignature = items
    .map((item) => `${item.platform}:${item.messages.length}`)
    .join('|');

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-sky-500 text-white">
            <Brain size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Agent</h2>
            <p className="text-sm text-slate-500">
              Ask about your connected apps and get things done.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={newConversation}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
        >
          <RotateCcw size={16} aria-hidden="true" />
          <span className="hidden sm:inline">New conversation</span>
        </button>
      </div>

      {isEmpty && (
        <>
          <RecentSummary
            key={summarySignature}
            items={items}
            gathering={gathering}
            connected={connected}
          />
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-500">
              Quick suggestions
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter.text}
                  type="button"
                  onClick={() => void sendMessage(starter.text)}
                  className="dashboard-card flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-violet-300 hover:bg-slate-50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-600">
                    <starter.icon size={18} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {starter.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!isEmpty && (
        <div className="mt-6 flex-1 space-y-5">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {(suggestions.length > 0 || loadingSuggestions) && !streaming && (
            <QuickReplies
              suggestions={suggestions}
              loading={loadingSuggestions}
              onPick={(text) => void sendMessage(text)}
            />
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <Composer
        disabled={streaming}
        gathering={gathering && !isEmpty}
        onSend={(text) => void sendMessage(text)}
      />
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-violet-500 px-4 py-3 text-sm leading-6 text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500 text-white">
        <Brain size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="dashboard-card rounded-3xl rounded-tl-lg border border-slate-200 bg-white p-4">
          {message.pending && !message.content ? (
            <TypingDots />
          ) : (
            <Markdown>{message.content}</Markdown>
          )}
        </div>
        {!message.pending && message.sources && message.sources.length > 0 && (
          <SourcesRow sources={message.sources} />
        )}
      </div>
    </div>
  );
}

function SourcesRow({ sources }: { sources: string[] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-slate-400">Sources:</span>
      {sources.map((id) => (
        <span
          key={id}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
        >
          <Image
            src={platformLogo(id)}
            alt=""
            width={14}
            height={14}
            className="size-3.5 object-contain"
          />
          {platformName(id)}
        </span>
      ))}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      <span className="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
      <span className="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
      <span className="size-2 animate-bounce rounded-full bg-slate-400" />
    </span>
  );
}

function QuickReplies({
  suggestions,
  loading,
  onPick,
}: {
  suggestions: string[];
  loading: boolean;
  onPick: (text: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 pl-12">
      {loading && suggestions.length === 0 ? (
        <span className="text-xs font-medium text-slate-400">
          Thinking of follow-ups…
        </span>
      ) : (
        suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            {suggestion}
          </button>
        ))
      )}
    </div>
  );
}

function Composer({
  disabled,
  gathering,
  onSend,
}: {
  disabled: boolean;
  gathering: boolean;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState('');

  function submit() {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
  }

  return (
    <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-[#f7f8fc] via-[#f7f8fc] to-transparent pt-4">
      {gathering && (
        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Sparkles size={14} className="animate-pulse" aria-hidden="true" />
          Fetching your latest activity…
        </p>
      )}
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Ask your assistant anything…"
          className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function RecentSummary({
  items,
  gathering,
  connected,
}: {
  items: GatheredItems;
  gathering: boolean;
  connected: string[];
}) {
  const [top, setTop] = useState<BriefingResult['top'] | null>(null);
  const [loading, setLoading] = useState(items.length > 0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (items.length === 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch('/api/briefing/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        const data = (await response
          .json()
          .catch(() => ({}))) as BriefingResult & { error?: string };
        if (!cancelled && response.ok) setTop(data.top ?? null);
      } catch {
        /* ignore */
      }
      if (!cancelled) setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <section className="dashboard-card mt-6 rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-violet-600" aria-hidden="true" />
        <h3 className="text-base font-bold tracking-tight">Recent summary</h3>
      </div>

      {connected.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No apps connected yet.{' '}
          <Link
            href="/integrations"
            className="font-semibold text-violet-600 underline underline-offset-2"
          >
            Connect an app
          </Link>{' '}
          so the assistant can use your data.
        </p>
      ) : gathering || loading ? (
        <div className="mt-3 space-y-2">
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-100" />
        </div>
      ) : top ? (
        <>
          <p className="mt-3 text-sm leading-6 text-slate-600">{top.summary}</p>
          {top.highlights.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {top.highlights.map((highlight, index) => (
                <li
                  key={index}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  <span className="size-1.5 rounded-full bg-violet-500" />
                  {highlight}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          All clear — nothing pressing in your latest activity.
        </p>
      )}
    </section>
  );
}
