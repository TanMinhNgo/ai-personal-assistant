// Shared platform metadata (id → name → logo) reused by the integrations page
// and the dashboard so there is a single source of truth for app branding.

export type PlatformMeta = {
  id: string;
  name: string;
  logo: string;
  tileClass?: string;
};

export const PLATFORMS: PlatformMeta[] = [
  { id: 'gmail', name: 'Gmail', logo: '/gmail.png' },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    logo: '/whatsapp.png',
    tileClass: 'bg-[#25D366]',
  },
  { id: 'slack', name: 'Slack', logo: '/slack.png' },
  { id: 'outlook', name: 'Outlook', logo: '/email.png' },
  { id: 'discord', name: 'Discord', logo: '/discord.png' },
  { id: 'linkedin', name: 'LinkedIn', logo: '/linkedin.png' },
  { id: 'telegram', name: 'Telegram', logo: '/telegram.png' },
  { id: 'other', name: 'Other platforms', logo: '/globe.svg' },
];

export const platformById: Record<string, PlatformMeta> = Object.fromEntries(
  PLATFORMS.map((platform) => [platform.id, platform])
);

export const platformName = (id: string) => platformById[id]?.name ?? id;
export const platformLogo = (id: string) =>
  platformById[id]?.logo ?? '/globe.svg';
