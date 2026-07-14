'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
import { saveVerifiedUserProfile } from '@/lib/auth-profile';
import { insforge } from '@/lib/insforge';

function VerifyEmailForm() {
  const router = useRouter();
  const query = useSearchParams();
  const email = query.get('email') ?? '';
  const name = query.get('name') ?? '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);

    const { data, error: authError } = await insforge.auth.verifyEmail({
      email,
      otp: code,
    });

    if (authError || !data?.user) {
      setError(authError?.message ?? 'Unable to verify that code.');
      setBusy(false);
      return;
    }

    try {
      await saveVerifiedUserProfile(data.user, name);
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

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`We sent a six-digit code to ${email || 'your email address'}.`}
    >
      <form className="mt-7 space-y-5" onSubmit={submit}>
        <label className="auth-field">
          <span className="auth-label">Verification code</span>
          <input
            aria-label="Verification code"
            className="auth-input text-center font-mono text-lg tracking-[0.45em]"
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="000000"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            required
          />
        </label>

        {error && <p className="text-sm leading-6 text-rose-300">{error}</p>}

        <button
          className="auth-primary"
          disabled={busy || !email}
          type="submit"
        >
          {busy ? 'Verifying...' : 'Verify email'}
        </button>
      </form>
    </AuthShell>
  );
}
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
