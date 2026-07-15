'use client';

import Image from 'next/image';
import { CheckCircle, GearSix, LinkSimple } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/DashboardShell';
import { IntegrationSettingsModal } from '@/components/IntegrationSettingsModal';
import { insforge } from '@/lib/insforge';

type Integration = { id: string; name: string; logo: string; description: string; actions: string[] };
type ConnectionStatus = 'connected' | 'disconnected';
type ConnectionMap = Record<string, ConnectionStatus>;

const integrations: Integration[] = [
  { id: 'gmail', name: 'Gmail', logo: '/gmail.png', description: 'Read, organize, and draft messages from your Gmail inbox.', actions: ['View mailbox profile', 'Search inbox and threads', 'Read messages and attachments', 'List and apply labels', 'Create and update drafts', 'Send approved drafts and emails'] },
  { id: 'whatsapp', name: 'WhatsApp', logo: '/whatsapp.png', description: 'Keep important customer and team conversations in one view.', actions: ['Review conversations', 'Create reply drafts', 'Manage notification rules'] },
  { id: 'slack', name: 'Slack', logo: '/slack.png', description: 'Bring channel updates and direct messages into your daily brief.', actions: ['Read channel updates', 'Search messages', 'Configure alert channels'] },
  { id: 'outlook', name: 'Outlook', logo: '/email.png', description: 'Coordinate your inbox and calendar from Microsoft Outlook.', actions: ['Read inbox messages', 'Review calendar events', 'Configure message alerts'] },
  { id: 'discord', name: 'Discord', logo: '/discord.png', description: 'Track community conversations without missing key discussions.', actions: ['Review server activity', 'Search conversations', 'Manage community alerts'] },
  { id: 'linkedin', name: 'LinkedIn', logo: '/linkedin.png', description: 'Keep up with professional messages and important networking updates.', actions: ['Review messages', 'Track connection requests', 'Configure activity summaries'] },
  { id: 'telegram', name: 'Telegram', logo: '/telegram.png', description: 'Surface the Telegram chats that need your attention first.', actions: ['Review chats', 'Search messages', 'Manage priority notifications'] },
  { id: 'other', name: 'Other platforms', logo: '/globe.svg', description: 'Connect another tool through a custom integration or webhook.', actions: ['Configure webhook', 'Set custom actions', 'Manage access permissions'] },
];

export function IntegrationsPage() {
  const [connections, setConnections] = useState<ConnectionMap>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Integration | null>(null);
  const [updatingPlatform, setUpdatingPlatform] = useState<string | null>(null);

  useEffect(() => {
    async function loadConnections() {
      const { data: authData } = await insforge.auth.getCurrentUser();
      const user = authData.user;
      if (!user) return;

      setUserId(user.id);
      const { data } = await insforge.database
        .from('user_integrations')
        .select('platform, status')
        .eq('user_id', user.id);

      const storedConnections = (data ?? []).reduce<ConnectionMap>((result, record) => {
        result[String(record.platform)] = record.status as ConnectionStatus;
        return result;
      }, {});

      // Gmail returns from the OAuth callback with ?gmail=connected — persist and clean the URL.
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('gmail') === 'connected') {
          const now = new Date().toISOString();
          const hasRecord = storedConnections.gmail !== undefined;
          if (hasRecord) await insforge.database.from('user_integrations').update({ status: 'connected', updated_at: now }).eq('user_id', user.id).eq('platform', 'gmail');
          else await insforge.database.from('user_integrations').insert([{ user_id: user.id, platform: 'gmail', status: 'connected', updated_at: now }]);
          storedConnections.gmail = 'connected';
        }
        if (params.has('gmail')) window.history.replaceState({}, '', '/integrations');
      }
      setConnections(storedConnections);
    }

    void loadConnections();
  }, []);

  async function toggleConnection(platform: string) {
    if (!userId || updatingPlatform) return;

    // Gmail uses a real Google OAuth connection scoped to the signed-in user.
    // The consent screen is opened client-side; only /api/gmail/callback runs server-side.
    if (platform === 'gmail' && connections.gmail !== 'connected') {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_GMAIL_CLIENT_ID;
      if (!clientId) return;
      const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authorizationUrl.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${window.location.origin}/api/gmail/callback`,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send',
        access_type: 'offline',
        prompt: 'consent',
        state: userId,
      }).toString();
      window.location.href = authorizationUrl.toString();
      return;
    }

    setUpdatingPlatform(platform);
    const nextStatus: ConnectionStatus = connections[platform] === 'connected' ? 'disconnected' : 'connected';
    const hasRecord = Object.prototype.hasOwnProperty.call(connections, platform);
    const now = new Date().toISOString();
    const { error } = hasRecord
      ? await insforge.database.from('user_integrations').update({ status: nextStatus, updated_at: now }).eq('user_id', userId).eq('platform', platform)
      : await insforge.database.from('user_integrations').insert([{ user_id: userId, platform, status: nextStatus, updated_at: now }]);

    if (!error) setConnections((current) => ({ ...current, [platform]: nextStatus }));
    setUpdatingPlatform(null);
  }

  const connectedCount = Object.values(connections).filter((status) => status === 'connected').length;

  return <AppShell title="Integrations"><div className="mx-auto max-w-7xl p-5 sm:p-8"><section className="flex flex-col justify-between gap-5 rounded-3xl bg-slate-950 p-6 text-white sm:flex-row sm:items-end sm:p-8"><div><span className="grid size-12 place-items-center rounded-2xl bg-emerald-500"><LinkSimple size={27} weight="bold" aria-hidden="true" /></span><h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Connect your workspaces</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Bring the platforms you use every day into OmniMind and decide exactly what the assistant can do with each connection.</p></div><span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">{connectedCount} connected</span></section><section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{integrations.map((integration) => { const isConnected = connections[integration.id] === 'connected'; const isUpdating = updatingPlatform === integration.id; return <article key={integration.id} className="dashboard-card flex min-h-[310px] flex-col rounded-3xl border border-slate-200 bg-white p-6"><div className="flex justify-between"><span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-emerald-600"><LinkSimple size={21} weight="bold" aria-hidden="true" /></span>{isConnected && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle size={14} weight="fill" aria-hidden="true" />Connected</span>}</div><div className="grid flex-1 place-items-center py-5"><span className={`grid h-20 place-items-center rounded-2xl ${integration.id === 'whatsapp' ? 'w-44 bg-[#25D366]' : ''}`}><Image src={integration.logo} alt={`${integration.name} logo`} width={72} height={72} className={integration.id === 'whatsapp' ? 'size-[72px] scale-[2.1] object-contain' : 'size-[72px] object-contain'} /></span></div><h3 className="text-lg font-bold">{integration.name}</h3><p className="mt-2 min-h-11 text-sm leading-5 text-slate-500">{integration.description}</p><div className="mt-5 flex gap-2">{isConnected && <button type="button" onClick={() => setSelected(integration)} className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500" aria-label={`${integration.name} settings`}><GearSix size={21} weight="bold" aria-hidden="true" /></button>}<button type="button" disabled={!userId || Boolean(updatingPlatform)} onClick={() => void toggleConnection(integration.id)} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${isConnected ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-slate-950 text-white hover:bg-slate-800'}`}>{isUpdating ? 'Saving...' : isConnected ? 'Disconnect' : 'Connect'}</button></div></article>; })}</section></div>{selected && <IntegrationSettingsModal integration={selected} onClose={() => setSelected(null)} />}</AppShell>;
}




