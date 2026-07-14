import Link from 'next/link';
import type { ReactNode } from 'react';

type AuthShellProps = {
  children: ReactNode;
  subtitle: string;
  title: string;
};

export function AuthShell({ children, subtitle, title }: AuthShellProps) {
  return (
    <main className="auth-page">
      <div className="auth-page__orb auth-page__orb--top" />
      <div className="auth-page__orb auth-page__orb--bottom" />

      <section className="auth-card">
        <Link
          href="/"
          className="auth-brand"
          aria-label="Go to OmniMind home page"
        >
          <span className="auth-brand__mark">O</span>
          <span>
            OmniMind<span className="text-violet-300">.ai</span>
          </span>
        </Link>

        <div className="mt-9">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{subtitle}</p>
        </div>

        {children}
      </section>
    </main>
  );
}
