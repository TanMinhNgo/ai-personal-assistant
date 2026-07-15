'use client';

import {
  ArrowLeft,
  Bell,
  Brain,
  ChevronsLeft,
  ChevronsRight,
  DollarSign,
  LayoutGrid,
  Link2,
  ListChecks,
  LogOut,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardHome } from '@/components/DashboardHome';
import { insforge } from '@/lib/insforge';

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
};
type TabKey =
  'ai-agent' | 'briefing' | 'integrations' | 'alerts' | 'settings' | 'pricing';
type SignedInUser = {
  email?: string | null;
  profile?: { name?: string | null } | null;
};

const navigation: NavigationItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutGrid, color: 'bg-violet-500' },
  { label: 'AI Agent', href: '/ai-agent', icon: Brain, color: 'bg-sky-500' },
  {
    label: 'Briefing',
    href: '/briefing',
    icon: ListChecks,
    color: 'bg-amber-400 text-amber-950',
  },
  {
    label: 'Integrations',
    href: '/integrations',
    icon: Link2,
    color: 'bg-emerald-500',
  },
  { label: 'Alerts', href: '/alerts', icon: Bell, color: 'bg-rose-500' },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    color: 'bg-slate-600',
  },
];

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SignedInUser | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await insforge.auth.getCurrentUser();
      setUser(data.user as SignedInUser | null);
    }

    void loadUser();
  }, []);

  const displayName =
    user?.profile?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'Signed in user';
  const initials = displayName.slice(0, 2).toUpperCase();

  async function signOut() {
    setIsSigningOut(true);
    const { error } = await insforge.auth.signOut();
    if (!error) router.push('/landing');
    setIsSigningOut(false);
  }

  return (
    <div
      className={`dashboard-shell ${isDark ? 'dashboard-shell--dark' : ''} flex h-dvh overflow-hidden bg-[#f7f8fc] text-slate-950`}
    >
      <aside
        className={`hidden h-dvh shrink-0 flex-col bg-slate-950 p-4 text-slate-100 transition-[width] duration-300 md:flex ${collapsed ? 'w-22' : 'w-70'}`}
      >
        <div className="flex items-center justify-between gap-2 px-1">
          <Link
            href="/"
            aria-label="OmniMind dashboard"
            className="flex min-w-0 items-center gap-3 overflow-hidden"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-500/25">
              <Sparkles size={24} aria-hidden="true" />
            </span>
            {!collapsed && (
              <span className="truncate text-lg font-bold tracking-tight">
                OmniMind
              </span>
            )}
          </Link>
          {!collapsed && (
            <button
              type="button"
              aria-label="Collapse sidebar"
              onClick={() => setCollapsed(true)}
              className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
            >
              <ChevronsLeft size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            aria-label="Expand sidebar"
            onClick={() => setCollapsed(false)}
            className="mt-7 grid size-11 place-items-center self-center rounded-2xl bg-white/10 text-slate-200 transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          >
            <ChevronsRight size={22} aria-hidden="true" />
          </button>
        )}

        <nav aria-label="Main navigation" className="mt-10 space-y-2">
          {navigation.map(({ label, href, icon: MenuIcon, color }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl p-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'} ${collapsed ? 'justify-center' : ''}`}
              >
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl text-white ${color}`}
                >
                  <MenuIcon size={24} aria-hidden="true" />
                </span>
                {!collapsed && <span className="font-medium">{label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-8">
          <Link
            href="/pricing-settings"
            title={collapsed ? 'Pricing Settings' : undefined}
            aria-current={pathname === '/pricing-settings' ? 'page' : undefined}
            className={`flex w-full items-center gap-3 rounded-2xl bg-violet-500 p-2 text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/20">
              <DollarSign size={24} aria-hidden="true" />
            </span>
            {!collapsed && (
              <span className="font-semibold">Pricing Settings</span>
            )}
          </Link>
          <div
            title={
              collapsed
                ? `${displayName}${user?.email ? ` (${user.email})` : ''}`
                : undefined
            }
            className={`mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500 text-xs font-bold text-white">
              {initials}
            </span>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">
                  {displayName}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-400">
                  {user?.email ?? 'Loading account...'}
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={isSigningOut}
              aria-label="Sign out"
              title="Sign out"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
            >
              <LogOut size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <main className="dashboard-main min-w-0 flex-1 overflow-y-auto bg-[#f7f8fc]">
        <header className="dashboard-header sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="OmniMind dashboard"
              className="grid size-10 place-items-center rounded-xl bg-violet-500 text-white md:hidden"
            >
              <Sparkles size={21} aria-hidden="true" />
            </Link>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tuesday, July 15
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/landing"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
            >
              <ArrowLeft size={20} aria-hidden="true" />
              <span className="hidden sm:inline">Back to landing</span>
            </Link>
            <button
              type="button"
              aria-label={
                isDark ? 'Switch to light mode' : 'Switch to dark mode'
              }
              onClick={() => setIsDark((value) => !value)}
              className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
            >
              {isDark ? (
                <Moon size={22} aria-hidden="true" />
              ) : (
                <Sun size={22} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              aria-label="Search"
              className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
            >
              <Search size={22} aria-hidden="true" />
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

export function DashboardShell() {
  return (
    <AppShell title="Dashboard">
      <DashboardHome />
    </AppShell>
  );
}

const tabContent: Record<
  TabKey,
  {
    title: string;
    description: string;
    action: string;
    icon: LucideIcon;
    color: string;
    details: string[];
  }
> = {
  'ai-agent': {
    title: 'AI Agent',
    description:
      'Start focused conversations and hand off routine work to your personal assistant.',
    action: 'Start a conversation',
    icon: Brain,
    color: 'bg-sky-500',
    details: [
      'Draft a reply from your inbox',
      'Build a plan for today',
      'Summarize your latest updates',
    ],
  },
  briefing: {
    title: 'Briefing',
    description:
      'A concise overview of the messages, meetings, and priorities that need your attention.',
    action: 'Generate today’s briefing',
    icon: ListChecks,
    color: 'bg-amber-400 text-amber-950',
    details: [
      '3 meetings prepared',
      '12 key messages summarized',
      '4 decisions waiting for you',
    ],
  },
  integrations: {
    title: 'Integrations',
    description:
      'Connect the tools you already use so OmniMind can keep your work in one place.',
    action: 'Add integration',
    icon: Link2,
    color: 'bg-emerald-500',
    details: [
      'Gmail is connected',
      'Google Calendar is connected',
      'Slack is ready to connect',
    ],
  },
  alerts: {
    title: 'Alerts',
    description:
      'Stay on top of important changes without being distracted by everything else.',
    action: 'Manage alerts',
    icon: Bell,
    color: 'bg-rose-500',
    details: [
      '2 high-priority alerts',
      '5 messages need review',
      'No missed deadlines',
    ],
  },
  settings: {
    title: 'Settings',
    description:
      'Control your profile, preferences, notifications, and assistant behavior.',
    action: 'Save preferences',
    icon: Settings,
    color: 'bg-slate-600',
    details: [
      'Profile and account',
      'Notification preferences',
      'Assistant personalization',
    ],
  },
  pricing: {
    title: 'Pricing Settings',
    description:
      'Manage your plan, billing details, and workspace limits from one place.',
    action: 'View plans',
    icon: DollarSign,
    color: 'bg-violet-500',
    details: [
      'Personal plan active',
      '14 days left in trial',
      'Update billing information',
    ],
  },
};

export function DashboardTabPage({ tab }: { tab: TabKey }) {
  const content = tabContent[tab];
  const TabIcon = content.icon;
  return (
    <AppShell title={content.title}>
      <div className="mx-auto max-w-7xl p-5 sm:p-8">
        <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <span
            className={`grid size-12 place-items-center rounded-2xl text-white ${content.color}`}
          >
            <TabIcon size={28} aria-hidden="true" />
          </span>
          <h2 className="mt-7 text-3xl font-bold tracking-tight sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            {content.description}
          </p>
          <button
            type="button"
            className="mt-7 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400 active:translate-y-px"
          >
            {content.action}
          </button>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {content.details.map((detail) => (
            <div
              key={detail}
              className="dashboard-card rounded-3xl border border-slate-200 bg-white p-6"
            >
              <span
                className={`grid size-11 place-items-center rounded-2xl text-white ${content.color}`}
              >
                <TabIcon size={23} aria-hidden="true" />
              </span>
              <p className="mt-5 text-lg font-bold">{detail}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ready to review and manage from this workspace.
              </p>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
