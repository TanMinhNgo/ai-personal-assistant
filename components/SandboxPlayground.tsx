'use client';

import { FileText } from 'lucide-react';

import React, { useState } from 'react';

export const SandboxPlayground: React.FC = () => {
  const [sandboxInput, setSandboxInput] = useState<string>(
    "Hi, please send me the report by tomorrow afternoon. We need to submit it to client by 5 PM. Also, ask Sarah if she's joining us."
  );
  const [sandboxOutput, setSandboxOutput] = useState<{
    summary: string;
    tasks: string[];
    reply: string;
  } | null>(null);
  const [isSandboxLoading, setIsSandboxLoading] = useState<boolean>(false);

  const handleSandboxSimulate = () => {
    setIsSandboxLoading(true);
    setSandboxOutput(null);
    setTimeout(() => {
      // Basic heuristic generation to make it feel alive!
      let summary =
        'Message request to complete a report submission for clients. It contains requests to prompt colleagues.';
      let tasks = [
        'Complete and send report (Due: Tomorrow afternoon, before 5:00 PM)',
      ];
      let reply =
        "I'll finalize the report and coordinate with Sarah right away.";

      if (sandboxInput.toLowerCase().includes('report')) {
        summary =
          'Request for report finalization with a hard deadline tomorrow at 5:00 PM, and coordination with Sarah.';
        tasks = [
          'Submit report to client (Due: Tomorrow, 5:00 PM)',
          'Verify if Sarah is joining the team/meeting',
        ];
        reply =
          "Copy that. I've scheduled the report handoff and messaged Sarah.";
      } else if (
        sandboxInput.toLowerCase().includes('contract') ||
        sandboxInput.toLowerCase().includes('sign')
      ) {
        summary =
          'Action item concerning contract signature and PDF verification.';
        tasks = [
          'Get contract signed (Due: Friday)',
          'Request updated PDF version from Dave',
        ];
        reply =
          "I've requested the PDF and added the contract signing to your calendar.";
      } else if (
        sandboxInput.toLowerCase().includes('dinner') ||
        sandboxInput.toLowerCase().includes('tuesday')
      ) {
        summary =
          'Personal reminder to schedule dinner next Tuesday. Excludes Monday and Thursday due to unavailability.';
        tasks = [
          'Schedule dinner (Date: Next Tuesday)',
          'Check calendar availability for Tuesday evening',
        ];
        reply = "Perfect, Tuesday works. I've sent a calendar hold.";
      } else {
        const sentences = sandboxInput
          .split(/[.!?]/)
          .filter((s) => s.trim().length > 0);
        summary = sentences[0]
          ? `AI detected core topic: "${sentences[0].trim()}".`
          : 'Message parsed successfully.';
        tasks = sentences.map((s) => `Action item: ${s.trim()}`).slice(0, 3);
        reply =
          'Noted. I am queueing this update and notifying related contacts.';
      }

      setSandboxOutput({ summary, tasks, reply });
      setIsSandboxLoading(false);
    }, 1000);
  };

  return (
    <section
      id="sandbox"
      className="relative border-t border-white/5 bg-black py-24 px-6 sm:px-8"
    >
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
            Sandbox Playground
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mt-2">
            Try Custom AI Parsing
          </h2>
          <p className="mt-3 text-zinc-400 text-sm">
            Type or select a raw message below and click &quot;Summarize with
            AI&quot; to test the parsing model right now.
          </p>
        </div>

        {/* Sandbox Widget Frame */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950/40 p-6 backdrop-blur-md shadow-2xl">
          {/* Presets row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-zinc-500 font-bold">
              Try presets:
            </span>
            <button
              onClick={() =>
                setSandboxInput(
                  'Hey, can you make sure we get the contract signed by Friday? Tell Dave to send the updated PDF version as well.'
                )
              }
              className="px-3 py-1 rounded-full border border-white/5 bg-[#080808] hover:bg-white/5 text-[10px] text-zinc-300 font-medium transition-colors"
            >
              📝 Contract Signature
            </button>
            <button
              onClick={() =>
                setSandboxInput(
                  "Just checking in. Let's schedule dinner next Tuesday. I'm busy on Monday and Thursday. Let me know!"
                )
              }
              className="px-3 py-1 rounded-full border border-white/5 bg-[#080808] hover:bg-white/5 text-[10px] text-zinc-300 font-medium transition-colors"
            >
              🍽️ Schedule Dinner
            </button>
            <button
              onClick={() =>
                setSandboxInput(
                  "Hi, please send me the report by tomorrow afternoon. We need to submit it to client by 5 PM. Also, ask Sarah if she's joining us."
                )
              }
              className="px-3 py-1 rounded-full border border-white/5 bg-[#080808] hover:bg-white/5 text-[10px] text-zinc-300 font-medium transition-colors"
            >
              📊 Report Handoff
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Custom Input */}
            <div className="flex flex-col text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Raw Input Text
              </label>
              <textarea
                value={sandboxInput}
                onChange={(e) => setSandboxInput(e.target.value)}
                placeholder="Type anything here..."
                className="w-full flex-1 rounded-xl border border-white/10 bg-[#050505] p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none min-h-40 resize-none"
              />
              <button
                onClick={handleSandboxSimulate}
                disabled={isSandboxLoading}
                className="mt-4 w-full rounded-xl bg-linear-to-r from-purple-600 to-cyan-500 py-3 text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isSandboxLoading
                  ? 'Summarizing with AI...'
                  : 'Summarize with AI'}
              </button>
            </div>

            {/* Parsed Output */}
            <div className="rounded-xl border border-purple-500/10 bg-[#07070b] p-4 flex flex-col justify-between min-h-55 text-left">
              {isSandboxLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  <span className="text-xs text-zinc-500">
                    Synthesizing data channels...
                  </span>
                </div>
              ) : sandboxOutput ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                      Executive Summary
                    </span>
                    <p className="text-zinc-200 bg-white/5 border border-white/5 p-2 rounded leading-relaxed">
                      {sandboxOutput.summary}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                      Extracted Tasks
                    </span>
                    <div className="space-y-1">
                      {sandboxOutput.tasks.map((task, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-zinc-300 bg-black/40 p-2 rounded border border-white/5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                      Auto Response Draft
                    </span>
                    <p className="text-purple-300 italic bg-purple-500/5 border border-purple-500/10 p-2 rounded">
                      &quot;{sandboxOutput.reply}&quot;
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <FileText
                    className="mb-2 size-8 text-zinc-600"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-zinc-500">
                    Parsed variables, lists, and context will appear here.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
