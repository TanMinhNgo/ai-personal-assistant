'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuthStore } from '@/lib/auth-store';

export function Header() {
  const { isReady, setReady, setUser, user } = useAuthStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await insforge.auth.getCurrentUser();

      if (!active) return;

      setUser(
        data.user?.email
          ? {
              email: data.user.email,
              name: data.user.profile?.name ?? undefined,
            }
          : null
      );
      setReady(true);
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [setReady, setUser]);

  async function signOut() {
    setIsSigningOut(true);
    const { error } = await insforge.auth.signOut();

    if (!error) {
      setUser(null);
    }

    setIsSigningOut(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-2">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-purple-600 to-cyan-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-transform duration-300 group-hover:scale-105">
            <span className="text-base font-bold text-white">O</span>
          </span>
          <span className="hidden text-xl font-bold tracking-tight text-zinc-100 sm:block">
            OmniMind<span className="text-cyan-400">.ai</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
          <a href="#features" className="transition-colors hover:text-white">
            Features
          </a>
          <a
            href="#integrations"
            className="transition-colors hover:text-white"
          >
            Integrations
          </a>
          <a href="#demo" className="transition-colors hover:text-white">
            Live Demo
          </a>
          <a href="#sandbox" className="transition-colors hover:text-white">
            Sandbox
          </a>
          <a href="#security" className="transition-colors hover:text-white">
            Security
          </a>
          <a href="#faq" className="transition-colors hover:text-white">
            FAQs
          </a>
        </nav>

        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {isReady && user ? (
            <>
              <div className="min-w-0 text-right">
                <p className="truncate text-xs font-semibold text-zinc-100 sm:text-sm">
                  {user.name || user.email}
                </p>
                {user.name && (
                  <p className="hidden max-w-52 truncate text-xs text-zinc-400 sm:block">
                    {user.email}
                  </p>
                )}
              </div>
              <button
                className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                disabled={isSigningOut}
                onClick={signOut}
                type="button"
              >
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="whitespace-nowrap text-xs font-semibold text-zinc-300 transition-colors hover:text-white sm:text-sm"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-violet-400 px-3 py-2 text-[11px] font-semibold text-zinc-950 transition-colors hover:bg-violet-300 sm:px-5 sm:text-xs"
              >
                Start<span className="hidden sm:inline"> free</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
