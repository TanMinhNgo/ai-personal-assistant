'use client';

import Image from 'next/image';
import { LoaderCircle, X } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_KEYS, type CategoryKey } from '@/lib/briefing-ai';
import { CATEGORY_LABELS, type GatheredItems } from '@/lib/briefing-data';
import { computeNextRun, type Frequency } from '@/lib/briefing-schedule';
import { PLATFORMS, platformLogo } from '@/lib/integrations';
import { insforge } from '@/lib/insforge';

type Props = {
  userId: string;
  connected: string[];
  items: GatheredItems;
  onClose: () => void;
  onCreated: () => void;
};

export function CustomBriefingDialog({
  userId,
  connected,
  items,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [apps, setApps] = useState<string[]>(connected);
  const [categories, setCategories] = useState<CategoryKey[]>([
    ...CATEGORY_KEYS,
  ]);
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [generateNow, setGenerateNow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value)
      ? list.filter((entry) => entry !== value)
      : [...list, value];
  }

  async function save() {
    if (!name.trim()) {
      setError('Give your briefing a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const nextRun = computeNextRun(frequency, scheduledTime);
      const { error: insertError } = await insforge.database
        .from('briefing_schedules')
        .insert([
          {
            user_id: userId,
            name: name.trim(),
            description: description.trim(),
            apps: JSON.stringify(apps),
            categories: JSON.stringify(categories),
            scheduled_time: scheduledTime,
            frequency,
            priority,
            enabled: true,
            next_run_at: nextRun.toISOString(),
            created_at: new Date().toISOString(),
          },
        ]);
      if (insertError) {
        setError('Could not save the briefing. Is the database set up?');
        setSaving(false);
        return;
      }

      if (generateNow && items.length > 0) {
        const filtered = apps.length
          ? items.filter((item) => apps.includes(item.platform))
          : items;
        const response = await fetch('/api/briefing/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: filtered,
            goal: description.trim(),
            categories,
          }),
        });
        const generated = await response.json().catch(() => ({}));
        if (response.ok && generated.top) {
          await insforge.database.from('briefings').insert([
            {
              user_id: userId,
              kind: 'custom',
              title: name.trim(),
              data: JSON.stringify({ ...generated, items: filtered }),
              created_at: new Date().toISOString(),
            },
          ]);
        }
      }

      onCreated();
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-briefing-title"
        className="dashboard-card flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <h2
            id="custom-briefing-title"
            className="text-lg font-bold tracking-tight"
          >
            Create custom briefing
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Close"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
          <Field label="Briefing name">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Morning work digest"
              className={inputClass}
              autoFocus
            />
          </Field>

          <Field label="Description or goal">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              placeholder="Summarize urgent client emails and unread team chats."
              className={inputClass}
            />
          </Field>

          <Field label="Apps">
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.filter((platform) => platform.id !== 'other').map(
                (platform) => {
                  const isConnected = connected.includes(platform.id);
                  const active = apps.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      disabled={!isConnected}
                      title={
                        isConnected
                          ? undefined
                          : 'Connect this app on the Integrations page first'
                      }
                      onClick={() =>
                        isConnected &&
                        setApps((list) => toggle(list, platform.id))
                      }
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        !isConnected
                          ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                          : active
                            ? 'border-violet-300 bg-violet-50 text-slate-950'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Image
                        src={platformLogo(platform.id)}
                        alt=""
                        width={18}
                        height={18}
                        className={`size-4 object-contain ${isConnected ? '' : 'grayscale'}`}
                      />
                      {platform.name}
                      {!isConnected && (
                        <span className="text-[10px] font-medium text-slate-400">
                          · not connected
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
            {connected.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">
                No apps connected yet — connect one on the Integrations page to
                include it.
              </p>
            )}
          </Field>

          <Field label="Categories">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_KEYS.map((key) => {
                const active = categories.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategories((list) => toggle(list, key))}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${active ? 'border-violet-300 bg-violet-50 text-slate-950' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {CATEGORY_LABELS[key]}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Scheduled time (UTC)">
              <input
                type="time"
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Frequency">
              <select
                value={frequency}
                onChange={(event) =>
                  setFrequency(event.target.value as Frequency)
                }
                className={inputClass}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </Field>
          </div>

          <Field label="Priority">
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as 'high' | 'medium' | 'low')
              }
              className={inputClass}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={generateNow}
              onChange={(event) => setGenerateNow(event.target.checked)}
              className="size-4 rounded border-slate-300 text-violet-600"
            />
            Generate the first briefing now
          </label>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && (
              <LoaderCircle
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
            )}
            {saving ? 'Saving…' : 'Create briefing'}
          </button>
        </footer>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus-visible:ring-2 focus-visible:ring-violet-500/30';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
