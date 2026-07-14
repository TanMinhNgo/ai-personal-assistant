'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
import { saveVerifiedUserProfile } from '@/lib/auth-profile';
import { insforge } from '@/lib/insforge';

export default function AuthCompletePage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    async function complete() {
      const { data, error: authError } = await insforge.auth.getCurrentUser();

      if (authError || !data.user) {
        setError(
          authError?.message ??
            'Your Google sign-in session could not be confirmed.'
        );
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
      }
    }

    void complete();
  }, [router]);

  return (
    <AuthShell
      title="Finishing sign-in"
      subtitle={error || 'We are securely connecting your account.'}
    >
      <div
        className="mt-8 flex items-center gap-3 text-sm text-zinc-300"
        role="status"
      >
        {error ? (
          <span
            className="h-2.5 w-2.5 rounded-full bg-rose-300"
            aria-hidden="true"
          />
        ) : (
          <span className="auth-spinner" aria-hidden="true" />
        )}
        <span>
          {error ? 'Please try signing in again.' : 'Checking your session...'}
        </span>
      </div>
    </AuthShell>
  );
}
