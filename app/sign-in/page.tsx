'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
import { saveVerifiedUserProfile } from '@/lib/auth-profile';
import { insforge } from '@/lib/insforge';

function SignInForm() {
  const router = useRouter();
  const query = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);

    const { data, error: authError } = await insforge.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data?.user) {
      setError(authError?.message ?? 'Unable to sign in.');
      setBusy(false);
      return;
    }

    try {
      await saveVerifiedUserProfile(data.user);
      router.replace('/');
    } catch (profileError) {
      setError(
        profileError instanceof Error
          ? profileError.message
          : 'Unable to save your profile.'
      );
      setBusy(false);
    }
  }

  async function google() {
    setError('');
    setBusy(true);

    const { error: authError } = await insforge.auth.signInWithOAuth('google', {
      redirectTo: `${window.location.origin}/auth/complete`,
      additionalParams: { prompt: 'select_account' },
    });

    if (authError) {
      setError(authError.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep your communications organized in one place."
    >
      {query.get('insforge_status') === 'success' && (
        <p className="mt-6 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-200">
          Email verified. You can now sign in.
        </p>
      )}

      <form className="mt-7 space-y-5" onSubmit={submit}>
        <label className="auth-field">
          <span className="auth-label">Email address</span>
          <input
            aria-label="Email"
            className="auth-input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Password</span>
          <input
            aria-label="Password"
            className="auth-input"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="text-sm leading-6 text-rose-300">{error}</p>}

        <button className="auth-primary" disabled={busy} type="submit">
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-700" />
        or continue with
        <span className="h-px flex-1 bg-zinc-700" />
      </div>

      <button
        className="auth-secondary gap-3"
        disabled={busy}
        onClick={google}
        type="button"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt=""
          className="h-4 w-4"
        />
        Continue with Google
      </button>

      <p className="mt-7 text-center text-sm text-zinc-400">
        New to OmniMind?{' '}
        <Link
          className="font-semibold text-violet-300 hover:text-violet-200"
          href="/sign-up"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
