'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
import { insforge } from '@/lib/insforge';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);

    const { data, error: authError } = await insforge.auth.signUp({
      email,
      password,
      name,
    });

    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }

    if (data?.requireEmailVerification) {
      router.push(
        `/verify-email?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`
      );
      return;
    }

    router.replace('/');
  }

  async function google() {
    setError('');
    setBusy(true);

    const { error: authError } = await insforge.auth.signInWithOAuth('google', {
      redirectTo: `${window.location.origin}/auth/complete`,
    });

    if (authError) {
      setError(authError.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start filtering the noise and focusing on what matters."
    >
      <form className="mt-7 space-y-5" onSubmit={submit}>
        <label className="auth-field">
          <span className="auth-label">Your name</span>
          <input
            aria-label="Name"
            className="auth-input"
            autoComplete="name"
            placeholder="How should we call you?"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

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
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="text-sm leading-6 text-rose-300">{error}</p>}

        <button className="auth-primary" disabled={busy} type="submit">
          {busy ? 'Creating account...' : 'Create account'}
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
        Already have an account?{' '}
        <Link
          className="font-semibold text-violet-300 hover:text-violet-200"
          href="/sign-in"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
