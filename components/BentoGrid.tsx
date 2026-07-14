'use client';

import React, { useState, useEffect } from 'react';
import { PlatformIcon } from './Icons';

interface SearchResult {
  source: 'whatsapp' | 'gmail' | 'telegram' | 'outlook';
  sender: string;
  text: string;
  time: string;
}

const SEARCH_DATABASE: SearchResult[] = [
  {
    source: 'whatsapp',
    sender: 'Sarah (Product)',
    text: "Let's review the marketing budget spreadsheet tonight.",
    time: '1 hour ago',
  },
  {
    source: 'gmail',
    sender: 'Finance Dept',
    text: 'Attached is the Q3 Budget & Expenses Projection for your approval.',
    time: 'Yesterday',
  },
  {
    source: 'telegram',
    sender: '@dave_dev',
    text: 'I need approval on the Server budget expansion for AWS this month.',
    time: '2 days ago',
  },
  {
    source: 'outlook',
    sender: 'HR Global',
    text: 'Details regarding the new wellness budget program for 2026.',
    time: '3 days ago',
  },
  {
    source: 'whatsapp',
    sender: 'John',
    text: 'Did you talk to Sarah about the budget cuts for the design sprint?',
    time: '4 days ago',
  },
  {
    source: 'gmail',
    sender: 'Alex Carter',
    text: 'Re: Design contract & budget limits are finalized. Ready to sign.',
    time: '5 days ago',
  },
  {
    source: 'telegram',
    sender: 'Project Alpha Group',
    text: 'Meeting scheduled to discuss budget alignment next Monday at 10am.',
    time: '1 week ago',
  },
];

export const BentoGrid: React.FC = () => {
  // Bento checklist state
  const [bentoTasks, setBentoTasks] = useState([
    {
      id: 1,
      text: 'Review contract PDF from Alex',
      completed: false,
      source: 'gmail',
    },
    {
      id: 2,
      text: 'Ping Dev team about server error',
      completed: true,
      source: 'telegram',
    },
    {
      id: 3,
      text: 'Confirm meeting with client at 2pm',
      completed: false,
      source: 'whatsapp',
    },
    {
      id: 4,
      text: 'Submit training certification',
      completed: false,
      source: 'outlook',
    },
  ]);

  // Search simulator state
  const [searchQuery, setSearchQuery] = useState<string>('budget');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Live filter for unified search simulator
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = SEARCH_DATABASE.filter(
      (item) =>
        item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sender.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered);
  }, [searchQuery]);

  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-6 py-24 sm:px-8 border-t border-white/5"
    >
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Smarter Operations. Zero Noise.
        </h2>
        <p className="mt-4 text-zinc-400">
          OmniMind organizes incoming streams into clear data packages. Discover
          how it helps you manage focus.
        </p>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Central Intelligence Hub (Large) */}
        <div className="md:col-span-2 rounded-3xl bg-glass p-6 md:p-8 flex flex-col justify-between border border-white/10 min-h-[380px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 w-1/2 h-full opacity-20 pointer-events-none">
            {/* Background graphic grid */}
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute w-24 h-24 rounded-full border border-purple-500/40 animate-pulse-glow flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-purple-600/30 blur-md" />
              </div>
              {/* Simulated streaming lines */}
              <div className="absolute w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent rotate-45" />
              <div className="absolute w-48 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent -rotate-45" />
              <div className="absolute w-48 h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent rotate-90" />
            </div>
          </div>

          <div>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-6">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">
              Central Intelligence Hub
            </h3>
            <p className="mt-2 text-zinc-400 text-sm max-w-md leading-relaxed">
              Connect Outlook, Gmail, WhatsApp, and Telegram in 2 clicks. Our
              secure API parses metadata client-side, compiling incoming streams
              into a unified inbox categorized by relevance and urgency.
            </p>
          </div>

          {/* Interactive demo inside card */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-4 items-center">
            <span className="text-xs text-zinc-500 font-semibold">
              Integrations Status:
            </span>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[10px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{' '}
                Gmail Connected
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[10px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{' '}
                WhatsApp Live
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-[10px] text-purple-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />{' '}
                Telegram Connecting
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: AI Action Reminders (Medium) */}
        <div className="rounded-3xl bg-glass p-6 md:p-8 flex flex-col justify-between border border-white/10 min-h-[380px] group bg-glass-hover">
          <div>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Smart Reminders</h3>
            <p className="mt-2 text-zinc-400 text-sm leading-relaxed">
              OmniMind actively highlights deadlines, meeting invites, and
              direct requests mentioned inside casual threads.
            </p>
          </div>

          {/* Checklist simulator */}
          <div className="mt-6 space-y-2 bg-[#050505] p-3 rounded-xl border border-white/5">
            {bentoTasks.map((task) => (
              <label
                key={task.id}
                className="flex items-center gap-2.5 text-[11px] text-zinc-300 cursor-pointer select-none py-1 hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {
                    setBentoTasks(
                      bentoTasks.map((t) =>
                        t.id === task.id ? { ...t, completed: !t.completed } : t
                      )
                    );
                  }}
                  className="rounded border-white/15 text-purple-600 focus:ring-purple-500/20 bg-zinc-900 w-3 h-3"
                />
                <span
                  className={task.completed ? 'line-through text-zinc-500' : ''}
                >
                  {task.text}
                </span>
                <span className="ml-auto text-[8px] font-bold text-zinc-500 uppercase tracking-wider">
                  {task.source}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Card 3: Unified Search (Medium) */}
        <div className="rounded-3xl bg-glass p-6 md:p-8 flex flex-col justify-between border border-white/10 min-h-[380px] group bg-glass-hover">
          <div>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-6">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Cross-App Search</h3>
            <p className="mt-2 text-zinc-400 text-sm leading-relaxed font-sans">
              Search for links, instructions, or agreements. OmniMind queries
              all channels in real-time. Try typing &quot;budget&quot; or
              &quot;contract&quot; below:
            </p>
          </div>

          {/* Interactive Search simulator */}
          <div className="mt-6 flex flex-col gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to filter..."
                className="w-full rounded-lg border border-white/10 bg-[#050505] py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-cyan-500/50 focus:outline-none"
              />
              <svg
                className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Dynamic search results list */}
            <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1 border-t border-white/5 pt-2">
              {searchResults.length > 0 ? (
                searchResults.map((res, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-start gap-1 p-1.5 rounded bg-white/5 border border-white/5 text-[9px]"
                  >
                    <div className="truncate text-left">
                      <span className="font-bold text-zinc-300 block truncate">
                        {res.sender}
                      </span>
                      <span className="text-zinc-400 truncate">{res.text}</span>
                    </div>
                    <span className="text-[8px] text-zinc-600 bg-white/5 border border-white/5 px-1 py-0.2 rounded shrink-0 font-bold uppercase">
                      {res.source}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-zinc-600 text-center py-4">
                  No results. Try typing &quot;budget&quot; or
                  &quot;contract&quot;.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Security & Privacy (Large) */}
        <div className="md:col-span-2 rounded-3xl bg-glass p-6 md:p-8 flex flex-col justify-between border border-white/10 min-h-[380px] relative overflow-hidden group">
          <div className="absolute -bottom-8 -right-8 p-8 w-1/3 h-1/2 opacity-15 pointer-events-none">
            <svg
              className="w-full h-full text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          <div>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-6">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">
              Military-Grade Encryption &amp; Compliance
            </h3>
            <p className="mt-2 text-zinc-400 text-sm max-w-xl leading-relaxed">
              Your credentials and API messages are heavily guarded. We support
              local metadata isolation, SOC2 validation, and end-to-end data
              encryption. Your personal communications are processed on
              sandboxed cloud workers that never store messages once summarized.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Security Standard
              </span>
              <p className="text-xs font-semibold text-zinc-300">
                AES-256 E2EE Integration
              </p>
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                GDPR Compliance
              </span>
              <p className="text-xs font-semibold text-zinc-300">
                Self-serve Data Erasure
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
