// Shared schedule math for custom briefings. Times are interpreted as UTC in v1
// (the cron process runs in UTC); per-user local time would need a stored offset.
export type Frequency = 'hourly' | 'daily' | 'weekly';

export function computeNextRun(frequency: Frequency, scheduledTime: string, from: Date = new Date()): Date {
  const [hours, minutes] = scheduledTime.split(':').map((part) => Number(part) || 0);
  const next = new Date(from);

  if (frequency === 'hourly') {
    next.setUTCMinutes(minutes, 0, 0);
    if (next <= from) next.setUTCHours(next.getUTCHours() + 1);
    return next;
  }

  next.setUTCHours(hours, minutes, 0, 0);
  if (frequency === 'daily') {
    if (next <= from) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  // weekly — keep the same weekday/time, advance a week if already passed
  if (next <= from) next.setUTCDate(next.getUTCDate() + 7);
  return next;
}
