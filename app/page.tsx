'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { DemoSimulator } from '@/components/DemoSimulator';
import { BentoGrid } from '@/components/BentoGrid';
import { SandboxPlayground } from '@/components/SandboxPlayground';
import { FaqAccordion } from '@/components/FaqAccordion';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030303] text-zinc-100 font-sans selection:bg-purple-500/30 selection:text-purple-200 flex flex-col justify-between">
      {/* Background Glow effects */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-emerald-950/10 blur-[150px] pointer-events-none" />

      {/* Futuristic Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Page Content Wrapper */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero section */}
          <Hero />

          {/* Live Demo simulator */}
          <DemoSimulator />

          {/* Bento Grid Features */}
          <BentoGrid />

          {/* Sandbox Playground */}
          <SandboxPlayground />

          {/* FAQ Accordion */}
          <FaqAccordion />

          {/* CALL TO ACTION BANNER */}
          <section className="relative mx-auto max-w-7xl px-6 pb-24 sm:px-8">
            <div className="relative rounded-3xl overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-950/20 via-zinc-950 to-black p-8 md:p-12 flex flex-col items-center text-center shadow-[0_0_50px_rgba(139,92,246,0.1)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-purple-500/5 blur-[80px] pointer-events-none" />

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gradient">
                Reclaim Your Time &amp; Attention Today.
              </h2>
              <p className="mt-4 max-w-md text-sm text-zinc-400 leading-relaxed">
                Join 12,000+ knowledge workers using OmniMind.ai to filter out
                notifications and focus on high-impact work.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
                <input
                  type="email"
                  placeholder="Enter your corporate email..."
                  className="rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none w-full sm:w-auto sm:flex-1"
                />
                <button
                  onClick={() =>
                    alert('Thank you for signing up! We will contact you soon.')
                  }
                  className="rounded-xl bg-white text-black px-6 py-3 text-xs font-bold hover:bg-zinc-200 transition-colors shrink-0"
                >
                  Get Beta Access
                </button>
              </div>
              <p className="mt-3 text-[10px] text-zinc-500">
                Free 14-day trial • No credit card required
              </p>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
