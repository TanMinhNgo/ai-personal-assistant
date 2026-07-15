'use client';

import React, { useState } from 'react';

export const FaqAccordion: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Is it safe to connect my Gmail and WhatsApp accounts?',
      a: 'Yes, security is our primary focus. We use standard OAuth 2.0 to access email accounts securely without storing password credentials. For messaging services like WhatsApp and Telegram, data is processed using sandboxed cloud workers that never store messages locally or train public models with your private communications.',
    },
    {
      q: 'How does the AI identify action items inside group chats?',
      a: "Our fine-tuned LLM parses conversation threads for semantics indicating commitments, direct requests, deadlines, and questions. It accurately resolves pronouns (e.g., matching 'I will do it' to the correct sender) and lists them as actionable checklist items.",
    },
    {
      q: 'Can I customize the frequency of digests and reports?',
      a: 'Absolutely. You can set the frequency in your dashboard settings: instantly for emergency alerts, once an hour, or as a single daily digest delivered to your preferred platform (e.g., receiving a Telegram summary of your Gmail messages every evening at 6 PM).',
    },
    {
      q: 'Does OmniMind support custom enterprise systems?',
      a: 'Yes, our enterprise plan allows custom Slack, Teams, Jira, and custom database integrations. Contact our engineering team for on-premise deployments or custom API mappings.',
    },
  ];

  return (
    <section
      id="faq"
      className="relative border-t border-white/5 bg-[#050505] py-24 px-6 sm:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-zinc-400 text-sm">
            Everything you need to know about our AI assistant integrations.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-black overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-semibold text-zinc-200 hover:text-white transition-colors"
                >
                  <span>{faq.q}</span>
                  <svg
                    className={`h-4.5 w-4.5 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-400' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3 bg-white/1 text-left">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
