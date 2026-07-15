'use client';

import { LoaderCircle, Smartphone, MessageCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = { userId: string; onClose: () => void; onConnected: () => void };

export function WhatsAppConnectModal({ userId, onClose, onConnected }: Props) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitPhone(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/whatsapp/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, phone }),
      });
      const data = (await response.json()) as { status?: string; pairingCode?: string | null; error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Could not start the connection.');
      } else if (data.status === 'connected') {
        onConnected();
        return;
      } else if (data.pairingCode) {
        setCode(data.pairingCode);
        setStep('code');
      } else {
        setError(data.error ?? 'Could not generate a pairing code.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  // Poll connection status once a pairing code is shown.
  useEffect(() => {
    if (step !== 'code') return;
    let active = true;
    const startedAt = Date.now();
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/whatsapp/status?userId=${encodeURIComponent(userId)}`);
        const data = (await response.json()) as { status?: string; error?: string };
        if (!active) return;
        if (data.status === 'connected') {
          active = false;
          clearInterval(timer);
          onConnected();
          return;
        }
        if (data.status === 'disconnected' && data.error) setError(data.error);
      } catch {
        /* keep polling */
      }
      if (active && Date.now() - startedAt > 120000) {
        active = false;
        clearInterval(timer);
        setError('Timed out waiting for the link. Please try again.');
      }
    }, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [step, userId, onConnected]);

  function retry() {
    setStep('phone');
    setCode(null);
    setError(null);
  }

  const formattedCode = code ? `${code.slice(0, 4)}-${code.slice(4)}` : '';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-connect-title"
        className="dashboard-card w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#25D366] text-white">
              <MessageCircle size={26} aria-hidden="true" />
            </span>
            <h2 id="whatsapp-connect-title" className="text-lg font-bold tracking-tight">
              Connect WhatsApp
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
            aria-label="Close"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        <div className="p-6">
          {step === 'phone' && (
            <form onSubmit={submitPhone} className="space-y-4">
              <div>
                <label htmlFor="wa-phone" className="text-sm font-semibold text-slate-700">
                  Phone number
                </label>
                <input
                  id="wa-phone"
                  type="tel"
                  autoFocus
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+1 415 555 0192"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#25D366] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#25D366]/30"
                />
                <p className="mt-2 text-xs text-slate-500">Include your country code, digits only (e.g. +1 415 555 0192).</p>
              </div>
              {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              <button
                type="submit"
                disabled={submitting || phone.replace(/\D/g, '').length < 8}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1fb855] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}
                {submitting ? 'Generating code…' : 'Get pairing code'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                <p className="text-xs font-semibold tracking-wider text-slate-500">YOUR PAIRING CODE</p>
                <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em] text-slate-950">{formattedCode}</p>
              </div>
              <ol className="space-y-2.5 text-sm leading-6 text-slate-700">
                <li className="flex gap-2.5">
                  <Step n={1} />
                  <span>Open <strong>WhatsApp</strong> on your phone.</span>
                </li>
                <li className="flex gap-2.5">
                  <Step n={2} />
                  <span>Tap <strong>Settings → Linked Devices → Link a device</strong>.</span>
                </li>
                <li className="flex gap-2.5">
                  <Step n={3} />
                  <span>Tap <strong>Link with phone number instead</strong> and enter the code above.</span>
                </li>
              </ol>
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                Waiting for you to link the device…
              </p>
              {error && (
                <div className="space-y-3">
                  <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
                  <button
                    type="button"
                    onClick={retry}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Smartphone size={18} aria-hidden="true" />
                    Try a different number
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#25D366] text-xs font-bold text-white">{n}</span>;
}
