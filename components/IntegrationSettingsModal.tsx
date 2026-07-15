'use client';

import Image from 'next/image';
import { MagnifyingGlass, PaperPlaneTilt, Plus, Terminal, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { getMcpConfig } from '@/lib/integration-mcp';

type Integration = { id: string; name: string; logo: string };

const RECIPIENT = 'you@omnisync.ai';

export function IntegrationSettingsModal({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const config = getMcpConfig(integration.id);
  const isWhatsApp = integration.id === 'whatsapp';
  const tabs = ['Interactive Inbox Console', `Available MCP Tools (${config.tools.length})`, 'MCP Connection Guide'];
  const [activeTab, setActiveTab] = useState(0);
  const [activeMessageId, setActiveMessageId] = useState(config.messages[Math.min(1, config.messages.length - 1)]?.id);
  const activeMessage = config.messages.find((message) => message.id === activeMessageId) ?? config.messages[0];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3 sm:p-6" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="integration-tools-title" className="dashboard-card flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className={`grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl ${isWhatsApp ? 'bg-[#25D366]' : 'bg-slate-100'}`}>
              <Image src={integration.logo} alt="" width={30} height={30} className={isWhatsApp ? 'size-8 scale-[1.7] object-contain' : 'size-8 object-contain'} />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 id="integration-tools-title" className="text-xl font-bold tracking-tight">{integration.name} Settings</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" />Active Sync</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Configure or test platform-specific Model Context Protocol (MCP) actions.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500" aria-label="Close"><X size={22} weight="bold" aria-hidden="true" /></button>
        </header>

        <nav className="flex gap-1 border-b border-slate-200 px-6 sm:px-8" aria-label="Settings sections">
          {tabs.map((tab, index) => {
            const active = activeTab === index;
            return (
              <button key={tab} type="button" onClick={() => setActiveTab(index)} className={`-mb-px whitespace-nowrap border-b-2 px-2 py-3.5 text-sm font-semibold transition ${active ? 'border-violet-500 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{tab}</button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {activeTab === 0 && <InboxConsole config={config} activeMessage={activeMessage} activeMessageId={activeMessageId} setActiveMessageId={setActiveMessageId} integration={integration} />}
          {activeTab === 1 && <ToolSchema config={config} />}
          {activeTab === 2 && <ConnectionGuide config={config} integration={integration} />}
        </div>
      </div>
    </div>
  );
}

function InboxConsole({ config, activeMessage, activeMessageId, setActiveMessageId, integration }: { config: ReturnType<typeof getMcpConfig>; activeMessage: ReturnType<typeof getMcpConfig>['messages'][number]; activeMessageId?: string; setActiveMessageId: (id: string) => void; integration: Integration }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,300px)_1fr_minmax(0,340px)]">
      {/* Inbox list */}
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2">
          <span className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
            <MagnifyingGlass size={17} weight="bold" aria-hidden="true" />
            <span>{config.searchPlaceholder}</span>
          </span>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-violet-400"><Plus size={16} weight="bold" aria-hidden="true" />{config.composeLabel}</button>
        </div>
        <ul className="space-y-2.5">
          {config.messages.map((message) => {
            const active = message.id === activeMessageId;
            return (
              <li key={message.id}>
                <button type="button" onClick={() => setActiveMessageId(message.id)} className={`w-full rounded-2xl border p-3.5 text-left transition ${active ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-slate-950">{message.sender}</span>
                    <span className="shrink-0 text-xs text-slate-400">{message.time}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-700">{message.subject}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500">{message.preview}</p>
                  {message.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{message.tags.map((tag) => <span key={tag} className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tag === 'URGENT' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>{tag}</span>)}</div>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Message detail */}
      <div className="flex flex-col justify-between bg-slate-950 p-6 text-slate-200">
        <div>
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-bold text-white">{activeMessage.subject}</h3>
            <span className="shrink-0 text-xs text-slate-400">{activeMessage.time}</span>
          </div>
          <p className="mt-3 text-sm text-slate-400">From: {activeMessage.signature.name} &lt;{activeMessage.handle}&gt;</p>
          <p className="text-sm text-slate-400">To: You &lt;{RECIPIENT}&gt;</p>
          <div className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
            {activeMessage.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            <p className="pt-2 text-slate-400">Best regards,<br />{activeMessage.signature.name}<br />{activeMessage.signature.role}</p>
          </div>
        </div>
        <button type="button" className="mt-8 inline-flex items-center justify-center gap-2 self-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"><PaperPlaneTilt size={17} weight="bold" aria-hidden="true" />Reply to Email</button>
      </div>

      {/* Live JSON-RPC console */}
      <div className="flex flex-col border-t border-slate-800 bg-[#0a0e17] lg:border-t-0 lg:border-l">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-300"><Terminal size={15} weight="bold" aria-hidden="true" />LIVE JSON-RPC CONSOLE</span>
          <span className="text-[10px] font-semibold tracking-wider text-slate-500">CLEAR TERMINAL</span>
        </div>
        <pre className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-5">{buildConsole(config, integration)}</pre>
      </div>
    </div>
  );
}

function buildConsole(config: ReturnType<typeof getMcpConfig>, integration: Integration): string {
  const [first, second] = config.tools;
  const lines: string[] = [];
  lines.push(`--> SEND REQUEST (${first.name})              5:53:02 PM`);
  lines.push('{');
  lines.push('  "jsonrpc": "2.0",');
  lines.push(`  "method": "${first.name}",`);
  lines.push('  "params": { "q": "label:inbox" },');
  lines.push('  "id": 584');
  lines.push('}');
  lines.push('');
  lines.push(`<-- RECV RESPONSE (${first.name})             5:53:02 PM`);
  lines.push('{');
  lines.push('  "jsonrpc": "2.0",');
  lines.push('  "result": {');
  lines.push('    "content": [');
  lines.push('      {');
  lines.push('        "type": "text",');
  lines.push(`        "text": "{ \\"${config.entityPlural}\\": [ { \\"id\\": \\"${config.messages[0]?.id}\\" } ] }"`);
  lines.push('      }');
  lines.push('    ]');
  lines.push('  }');
  lines.push('}');
  if (second) {
    lines.push('');
    lines.push(`--> SEND REQUEST (${second.name})              5:53:08 PM`);
    lines.push('{');
    lines.push('  "jsonrpc": "2.0",');
    lines.push(`  "method": "${second.name}",`);
    lines.push(`  "params": { "id": "${config.messages[0]?.id}" },`);
    lines.push('  "id": 585');
    lines.push('}');
  }
  lines.push('');
  lines.push(`# ${integration.name} MCP bridge connected`);
  return lines.join('\n');
}

function ToolSchema({ config }: { config: ReturnType<typeof getMcpConfig> }) {
  return (
    <div className="p-6 sm:p-8">
      <h3 className="text-lg font-bold tracking-tight">Model Context Protocol Schema</h3>
      <p className="mt-1 text-sm text-slate-500">Exposed tool schemas available to the connected assistant context models.</p>
      <ul className="mt-6 space-y-6">
        {config.tools.map((tool) => (
          <li key={tool.name}>
            <div className="flex items-baseline justify-between gap-4">
              <code className="font-mono text-sm font-bold text-violet-600">{tool.name}</code>
              <code className="shrink-0 font-mono text-xs text-slate-400">mcp_tool_schema</code>
            </div>
            <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
            <code className="mt-3 block break-words rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-600">arguments: {tool.args}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConnectionGuide({ config, integration }: { config: ReturnType<typeof getMcpConfig>; integration: Integration }) {
  const { guide } = config;
  return (
    <div className="p-6 sm:p-8">
      <h3 className="text-lg font-bold tracking-tight">MCP Setup Instructions</h3>
      <p className="mt-1 text-sm text-slate-500">Configure this server on your host machine to bridge real accounts.</p>
      <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5 text-sm leading-6 text-violet-900">
        OmniMind connects directly to active MCP servers. Make sure the corresponding server is installed on your machine and referenced in your host application&apos;s configuration.
      </div>
      <h4 className="mt-7 text-sm font-bold tracking-tight">{integration.name} MCP Server Integration Setup:</h4>
      <ol className="mt-4 space-y-5 text-sm leading-6 text-slate-700">
        <li className="flex gap-3"><Step n={1} /><div><p>Install the official {integration.name} MCP server globally:</p><Code>npm install -g {guide.pkg}</Code></div></li>
        <li className="flex gap-3"><Step n={2} /><p>Go to <a href={guide.console.url} target="_blank" rel="noreferrer" className="font-semibold text-violet-600 underline underline-offset-2">{guide.console.label}</a>, create a project, enable the {guide.apiName}, and configure the OAuth Consent Screen.</p></li>
        <li className="flex gap-3"><Step n={3} /><p>Create credentials of type <strong>Web application</strong> or <strong>Desktop app</strong>, download the client secret, and run the credentials verification script.</p></li>
        <li className="flex gap-3"><Step n={4} /><div><p>Set the <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{guide.credsEnv}</code> key in your local shell environment containing your OAuth client ID, client secret, and refresh token:</p><Code>{guide.credsEnv}=&apos;{'{"installed":{"client_id":"...","client_secret":"...","refresh_token":"..."}}'}&apos;</Code></div></li>
        <li className="flex gap-3"><Step n={5} /><p>OmniMind detects the environment variable and establishes the stdio interface bridge, allowing the assistant to read {config.entityPlural} and draft replies directly.</p></li>
      </ol>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-slate-950 text-xs font-bold text-white">{n}</span>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="mt-2 block break-words rounded-xl border border-slate-800 bg-[#0a0e17] px-4 py-3 font-mono text-xs text-emerald-300">{children}</code>;
}
