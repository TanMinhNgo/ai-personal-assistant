import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PlatformIcon } from './Icons';

export const Hero: React.FC = () => {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 sm:px-8 lg:pt-32 lg:pb-36 flex flex-col items-center text-center">
      {/* Animated Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-xs font-semibold text-purple-300 backdrop-blur-md animate-float-fast mb-8">
        <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
        <span>Integrates WhatsApp, Telegram, Gmail &amp; Outlook</span>
      </div>

      {/* Headline */}
      <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-tight">
        <span className="text-gradient">Your Digital Channels.</span>
        <br />
        <span className="text-gradient-purple-cyan">Synthesized by AI.</span>
      </h1>

      {/* Sub-headline */}
      <p className="mt-6 max-w-2xl text-lg text-zinc-400 leading-relaxed">
        OmniMind connects directly with your messaging accounts and inboxes.
        Stop digging through hundreds of notifications. Get instant summaries,
        automatic action-item checklists, and drafts in one unified dashboard.
      </p>

      {/* CTA Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
        <a
          href="#demo"
          className="flex items-center justify-center rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_4px_25px_rgba(139,92,246,0.5)] active:scale-[0.98]"
        >
          Connect My Accounts
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </a>
        <a
          href="#sandbox"
          className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3.5 text-sm font-semibold transition-all hover:border-white/20 active:scale-[0.98]"
        >
          Try Free Simulator
        </a>
      </div>

      {/* App Mockup Preview */}
      <div className="mt-16 w-full max-w-5xl rounded-2xl border border-white/10 bg-zinc-950/40 p-3 shadow-2xl backdrop-blur-2xl animate-float-slow">
        <div className="rounded-xl border border-white/5 overflow-hidden bg-black/80 aspect-video flex flex-col">
          {/* Window controls header */}
          <div className="flex h-10 w-full items-center justify-between border-b border-white/5 bg-[#080808] px-4">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <div className="rounded-md bg-white/5 px-6 py-0.5 text-[10px] text-zinc-500 tracking-wider">
              https://dashboard.omnimind.ai/feed
            </div>
            <div className="w-12" />
          </div>

          {/* Simulated Dashboard content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Mini sidebar */}
            <div className="hidden sm:flex w-48 border-r border-white/5 bg-[#050505] p-3 flex-col justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2 text-xs font-semibold text-white">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />{' '}
                  Unified Feed
                </div>
                <div className="flex items-center gap-2 rounded-lg p-2 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />{' '}
                  WhatsApp
                </div>
                <div className="flex items-center gap-2 rounded-lg p-2 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-sky-500" /> Telegram
                </div>
                <div className="flex items-center gap-2 rounded-lg p-2 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Gmail
                </div>
                <div className="flex items-center gap-2 rounded-lg p-2 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Outlook
                </div>
              </div>
              <div className="rounded-lg bg-purple-950/20 border border-purple-500/10 p-2 text-[10px] text-purple-300">
                ⚡ Premium Active
              </div>
            </div>

            {/* Feed simulation area */}
            <div className="flex-1 bg-black p-4 overflow-y-auto flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Live Agent Activity
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />{' '}
                  Listening
                </span>
              </div>

              {/* Simulated notifications */}
              <div className="space-y-3">
                <div className="rounded-xl border border-white/5 bg-[#09090b] p-3 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                      <PlatformIcon platform="whatsapp" className="w-4 h-4" />{' '}
                      WhatsApp Chat Summarized
                    </span>
                    <span className="text-[10px] text-zinc-500">Just Now</span>
                  </div>
                  <p className="text-zinc-300 font-medium">
                    Group &quot;Launch Prep&quot; (4 members):
                  </p>
                  <p className="text-zinc-400 text-[11px] mt-1 italic border-l-2 border-purple-500/40 pl-2">
                    &quot;Design team requires feedback on Q3 icons before the 3
                    PM cutoff today. Otherwise, we delay release.&quot;
                  </p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px]">
                    <span className="text-purple-300">
                      💡 Action: Review design assets
                    </span>
                    <span className="rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-purple-300">
                      Auto Task Created
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-[#09090b] p-3 text-xs opacity-85">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 font-semibold text-red-400">
                      <PlatformIcon platform="gmail" className="w-4 h-4" /> New
                      Digest Created
                    </span>
                    <span className="text-[10px] text-zinc-500">14m ago</span>
                  </div>
                  <p className="text-zinc-300 font-medium">
                    8 Newsletters Simplified:
                  </p>
                  <p className="text-zinc-400 text-[11px] mt-1">
                    Summarized TechRadar, TLDR, and ProductHunt digests into 4
                    key tech updates. No promotional ads.
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] text-zinc-400">
                      Tech
                    </span>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] text-zinc-400">
                      AI Trends
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration cloud logos */}
      <div
        id="integrations"
        className="mt-20 w-full max-w-4xl border-t border-white/5 pt-12"
      >
        <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest">
          Connect Seamlessly with Industry Leaders
        </p>
        <div className="mt-6 flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
          {/* WhatsApp */}
          <div className="flex items-center gap-2 hover:opacity-100 transition-opacity duration-300">
            <span className="text-[#25D366]">
              <PlatformIcon platform="whatsapp" className="w-6 h-6" />
            </span>
            <span className="font-semibold text-white tracking-wide">
              WhatsApp
            </span>
          </div>
          {/* Telegram */}
          <div className="flex items-center gap-2 hover:opacity-100 transition-opacity duration-300">
            <span className="text-[#0088cc]">
              <PlatformIcon platform="telegram" className="w-6 h-6" />
            </span>
            <span className="font-semibold text-white tracking-wide">
              Telegram
            </span>
          </div>
          {/* Gmail */}
          <div className="flex items-center gap-2 hover:opacity-100 transition-opacity duration-300">
            <span className="text-[#EA4335]">
              <PlatformIcon platform="gmail" className="w-6 h-6" />
            </span>
            <span className="font-semibold text-white tracking-wide">
              Gmail
            </span>
          </div>
          {/* Outlook */}
          <div className="flex items-center gap-2 hover:opacity-100 transition-opacity duration-300">
            <span className="text-[#0078d4]">
              <PlatformIcon platform="outlook" className="w-6 h-6" />
            </span>
            <span className="font-semibold text-white tracking-wide">
              Outlook
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
