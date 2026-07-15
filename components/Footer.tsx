import { Sparkles } from 'lucide-react';
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-[#030303] text-zinc-500 py-8 md:py-10 text-xs w-full mt-auto">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand Info */}
        <div className="col-span-2 space-y-3 text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-tr from-purple-600 to-cyan-500 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
              <Sparkles className="size-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              OmniMind.ai
            </span>
          </div>
          <p className="text-zinc-400 leading-relaxed max-w-sm">
            Smarter context tracking for unified communication streams.
            Automatically aggregate messages, extract reminders, and construct
            responses.
          </p>
          <p className="text-[10px] text-zinc-600">
            &copy; {new Date().getFullYear()} OmniMind Inc. All rights reserved.
          </p>
        </div>

        {/* Product links */}
        <div className="space-y-2 text-left">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            Product
          </h4>
          <ul className="space-y-1.5 font-medium">
            <li>
              <a
                href="#features"
                className="hover:text-zinc-300 transition-colors"
              >
                Features
              </a>
            </li>
            <li>
              <a href="#demo" className="hover:text-zinc-300 transition-colors">
                Live Demo
              </a>
            </li>
            <li>
              <a
                href="#sandbox"
                className="hover:text-zinc-300 transition-colors"
              >
                Sandbox
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Pricing Plan
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Enterprise
              </a>
            </li>
          </ul>
        </div>

        {/* Integrations links */}
        <div className="space-y-2 text-left">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            Integrations
          </h4>
          <ul className="space-y-1.5 font-medium">
            <li>
              <a
                href="#integrations"
                className="hover:text-zinc-300 transition-colors"
              >
                WhatsApp Bot
              </a>
            </li>
            <li>
              <a
                href="#integrations"
                className="hover:text-zinc-300 transition-colors"
              >
                Telegram Bot
              </a>
            </li>
            <li>
              <a
                href="#integrations"
                className="hover:text-zinc-300 transition-colors"
              >
                Gmail Add-on
              </a>
            </li>
            <li>
              <a
                href="#integrations"
                className="hover:text-zinc-300 transition-colors"
              >
                Outlook App
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Custom REST APIs
              </a>
            </li>
          </ul>
        </div>

        {/* Legal / Contact */}
        <div className="space-y-2 text-left">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            Company
          </h4>
          <ul className="space-y-1.5 font-medium">
            <li>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Security &amp; Trust
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Contact Engineering
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Media Kit
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
