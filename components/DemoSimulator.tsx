'use client';

import React, { useState, useEffect } from 'react';
import { PlatformIcon } from './Icons';

// Predefined tabs for the Interactive Demo
interface DemoTab {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  rawInput: string;
  rawSender: string;
  rawTime: string;
  aiSummary: string;
  aiActions: { text: string; done: boolean; tag?: string }[];
  suggestedReply: string;
}

const DEMO_TABS: DemoTab[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'whatsapp',
    color: '#25D366',
    bgColor: 'rgba(37, 211, 102, 0.1)',
    borderColor: 'rgba(37, 211, 102, 0.3)',
    textColor: 'text-[#25D366]',
    rawSender: 'Project Team Group',
    rawTime: '10:48 AM',
    rawInput: `[10:42 AM] Sarah: Hey, is anyone going to the meeting with the client at 2pm?
[10:43 AM] John: Yeah, I'll be there. Did we update the pitch deck?
[10:45 AM] Sarah: Not yet, I still need the Q3 sales numbers from David.
[10:46 AM] David: Sent them in the email thread last night!
[10:48 AM] Sarah: Perfect, I'll put them in the deck. John, can you double check the pricing slide before 1:30pm?
[10:49 AM] John: On it!`,
    aiSummary:
      "Team is preparing for a 2:00 PM client meeting. Sarah is updating the pitch deck with David's Q3 sales numbers. John is auditing the pricing slide prior to the final review.",
    aiActions: [
      {
        text: "Sarah: Update pitch deck with David's sales numbers",
        done: false,
        tag: '1:30 PM',
      },
      {
        text: 'John: Double-check pricing slide calculations',
        done: false,
        tag: '1:30 PM',
      },
      {
        text: 'All: Attend client presentation meeting',
        done: false,
        tag: '2:00 PM',
      },
    ],
    suggestedReply:
      'Thanks Sarah, pricing slide looks good! Ready for the 2 PM call.',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: 'gmail',
    color: '#EA4335',
    bgColor: 'rgba(234, 67, 53, 0.1)',
    borderColor: 'rgba(234, 67, 53, 0.3)',
    textColor: 'text-[#EA4335]',
    rawSender: 'Alex Carter <alex.c@designcorp.com>',
    rawTime: 'Yesterday, 6:14 PM',
    rawInput: `Subject: Project Alpha - Design Feedback & Next Steps

Hi Team,
I reviewed the landing page prototypes. The typography in Section 2 needs to be bolder, and the button contrast is too low. Let's fix that.
Also, please prepare the design spec document for the developers. We need this ready by Thursday morning.
Can we schedule a 15 min sync tomorrow to align? I'm free at 10 AM or 3 PM.

Best,
Alex`,
    aiSummary:
      'Design feedback from Alex Carter on Project Alpha landing page. Key requests include bolder typography in Section 2, higher button contrast, and creating a design specification document.',
    aiActions: [
      {
        text: 'Fix typography weights in Section 2 mockups',
        done: false,
        tag: 'UI Edit',
      },
      {
        text: 'Increase main CTA button color contrast ratio',
        done: true,
        tag: 'Accessibility',
      },
      {
        text: 'Draft developer design specification document',
        done: false,
        tag: 'Thursday',
      },
      {
        text: 'Schedule 15m alignment sync with Alex',
        done: false,
        tag: '10 AM / 3 PM',
      },
    ],
    suggestedReply:
      "Hi Alex, we've updated the contrast and scheduled the sync for 10 AM tomorrow.",
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'telegram',
    color: '#0088cc',
    bgColor: 'rgba(0, 136, 204, 0.1)',
    borderColor: 'rgba(0, 136, 204, 0.3)',
    textColor: 'text-[#0088cc]',
    rawSender: 'DevAlerts channel',
    rawTime: '03:12 AM',
    rawInput: `@vitalik1: Did everyone see the new API integration guide for the bot?
@dev_dan: Yeah, the webhook endpoint is failing with a 500 error on POST requests.
@support_mia: We are looking into it, looks like a database pool timeout.
@dev_dan: I'll pause our dev script for now. Let me know when it's resolved.
@support_mia: Resolved! Connection pool expanded. Let me know if issues persist.`,
    aiSummary:
      'An API outage occurred due to a database connection pool timeout on the webhook endpoint. Developer Dan paused scripts during debugging. Support Mia successfully resolved the server configuration error.',
    aiActions: [
      {
        text: 'Mia: Expanded server database connection pool limit',
        done: true,
        tag: 'Resolved',
      },
      {
        text: 'Dan: Resume development scripts & webhook tests',
        done: false,
        tag: 'Pending',
      },
      {
        text: 'Monitor server logs for pool errors next 12h',
        done: false,
        tag: 'Ops',
      },
    ],
    suggestedReply:
      '/status bot is running normally. CPU load at 12%. All connection tests passed.',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: 'outlook',
    color: '#0078d4',
    bgColor: 'rgba(0, 120, 212, 0.1)',
    borderColor: 'rgba(0, 120, 212, 0.3)',
    textColor: 'text-[#0078d4]',
    rawSender: 'HR Operations <hr@globalcorp.com>',
    rawTime: 'Monday, 9:00 AM',
    rawInput: `Subject: ACTION REQUIRED: Cyber Security Awareness Training 2026

Dear Employee,
This is a reminder that the annual Cyber Security Awareness Training module must be completed by July 20th, 2026. Failure to complete this course will result in temporary suspension of your corporate network access.
The training takes approximately 45 minutes and ends with a 15-question quiz.`,
    aiSummary:
      'Mandatory corporate announcement. Annual Cyber Security Awareness Training must be completed by July 20th. Failure to comply will lead to network suspension.',
    aiActions: [
      {
        text: 'Complete 45-minute security module',
        done: false,
        tag: 'Due July 20',
      },
      {
        text: 'Pass training quiz with score >= 80%',
        done: false,
        tag: 'Quiz',
      },
    ],
    suggestedReply: 'Launch LMS Portal -> Security Course 2026',
  },
];

export const DemoSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('whatsapp');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedTab, setProcessedTab] = useState<string>('whatsapp');

  useEffect(() => {
    setIsProcessing(true);
    const timer = setTimeout(() => {
      setIsProcessing(false);
      setProcessedTab(activeTab);
    }, 700);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const selectedData =
    DEMO_TABS.find((t) => t.id === processedTab) || DEMO_TABS[0];
  const activeTabColor =
    DEMO_TABS.find((t) => t.id === activeTab)?.color || '#8b5cf6';

  return (
    <section
      id="demo"
      className="relative border-t border-white/5 bg-[#050505] py-24 px-6 sm:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            See OmniMind In Action
          </h2>
          <p className="mt-4 text-zinc-400">
            Click on different channels below to see how our AI Agent
            intercepts, reads, and parses messy raw messages into high-utility
            reports and task boards.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Nav Tabs Selector */}
          <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-none">
            {DEMO_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 w-full text-left px-5 py-4 rounded-xl border transition-all shrink-0 lg:shrink ${
                    isActive
                      ? 'bg-glass border-purple-500/30 text-white shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                      : 'border-transparent bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <span style={{ color: isActive ? tab.color : '#71717a' }}>
                    <PlatformIcon platform={tab.icon} className="w-5 h-5" />
                  </span>
                  <span className="font-semibold text-sm">{tab.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Central Demonstration Box */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
            {/* Raw Message Card */}
            <div className="md:col-span-5 rounded-2xl border border-white/5 bg-black p-5 h-full flex flex-col justify-between min-h-[350px]">
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                    Raw Input Channel
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {selectedData.rawTime}
                  </span>
                </div>

                {/* Sender details */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300 uppercase">
                    {selectedData.rawSender.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">
                      {selectedData.rawSender}
                    </h4>
                    <p className="text-[10px] text-zinc-500">
                      Incoming Message Thread
                    </p>
                  </div>
                </div>

                {/* Body input content */}
                <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed bg-[#020202] p-3.5 rounded-lg border border-white/5 overflow-y-auto max-h-[220px]">
                  {selectedData.rawInput}
                </pre>
              </div>

              <div className="mt-4 flex justify-between items-center text-[10px] text-zinc-500 border-t border-white/5 pt-3">
                <span>Size: ~120 words</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />{' '}
                  Connected
                </span>
              </div>
            </div>

            {/* Processing Connector arrow */}
            <div className="md:col-span-1 flex flex-col items-center justify-center gap-2 py-4 md:py-0">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full border border-purple-500/20 bg-purple-500/5">
                <svg
                  className={`w-5 h-5 text-purple-400 ${isProcessing ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  {isProcessing ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 rounded-full bg-purple-500/10 blur" />
              </div>
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">
                {isProcessing ? 'Analyzing' : 'Agent'}
              </span>
            </div>

            {/* Structured Output Card */}
            <div className="md:col-span-5 rounded-2xl border border-purple-500/20 bg-[#09090d] p-5 h-full flex flex-col justify-between min-h-[350px] shadow-[0_0_30px_rgba(139,92,246,0.05)] relative overflow-hidden">
              {/* Shimmer loading mask */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex space-x-1">
                      <div
                        className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <div
                        className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <div
                        className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-purple-300">
                      Extracting context...
                    </span>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clipRule="evenodd"
                      />
                    </svg>
                    AI Synthesis Output
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    99.8% Accuracy
                  </span>
                </div>

                {/* Summary */}
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Executive Summary
                  </h5>
                  <p className="text-xs text-zinc-200 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                    {selectedData.aiSummary}
                  </p>
                </div>

                {/* Action Items */}
                <div className="mt-4">
                  <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Generated Actions
                  </h5>
                  <div className="space-y-2">
                    {selectedData.aiActions.map((action, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-zinc-300 bg-black/40 px-3 py-2 rounded-md border border-white/5"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={action.done}
                          className="mt-0.5 rounded border-white/10 text-purple-600 focus:ring-purple-500/20 bg-zinc-900 w-3.5 h-3.5"
                        />
                        <span
                          className={`leading-snug ${action.done ? 'line-through text-zinc-500' : ''}`}
                        >
                          {action.text}
                        </span>
                        {action.tag && (
                          <span className="ml-auto text-[9px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded shrink-0">
                            {action.tag}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggested Reply Draft */}
              <div className="mt-5 border-t border-white/5 pt-4">
                <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Draft Reply Suggestion
                </h5>
                <div className="flex gap-2">
                  <div className="flex-1 bg-purple-950/20 border border-purple-500/10 px-3 py-2 rounded-lg text-xs text-purple-300 italic">
                    &quot;{selectedData.suggestedReply}&quot;
                  </div>
                  <button
                    onClick={() =>
                      alert('Copied reply suggestion to clipboard!')
                    }
                    className="px-3 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg transition-colors border border-white/5 flex items-center justify-center shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
