import { DateTime } from 'luxon';
import db from '../db/client';
import { listTasks } from '../db/tasks';
import { getUserPreferences } from '../db/userPrefs';
import type { ReminderMode, TaskRecord } from '../db/types';

export interface ReminderCandidate {
  task: TaskRecord;
  scheduleAt: DateTime;
  mode: ReminderMode;
}

export function computeReminderCandidates(tasks: TaskRecord[], now: DateTime): ReminderCandidate[] {
  const candidates: ReminderCandidate[] = [];
  for (const task of tasks) {
    const anchor = task.start ?? task.due;
    if (!anchor) continue;
    const anchorTime = DateTime.fromISO(anchor);
    if (!anchorTime.isValid) continue;
    for (const policy of task.remindPolicy) {
      const scheduleAt = anchorTime.minus({ minutes: policy.offsetMin });
      if (scheduleAt.diff(now, 'days').days < -2) continue; // skip outdated reminders
      candidates.push({ task, scheduleAt, mode: policy.mode });
    }
  }
  return candidates;
}

export function groupCandidates(
  candidates: ReminderCandidate[],
  now: DateTime,
  aggregationWindowMin: number
) {
  const sorted = candidates
    .filter((candidate) => candidate.scheduleAt <= now)
    .sort((a, b) => a.scheduleAt.toMillis() - b.scheduleAt.toMillis());
  const groups: Array<{ windowStart: DateTime; windowEnd: DateTime; items: ReminderCandidate[] }> = [];
  for (const candidate of sorted) {
    const windowStart = candidate.scheduleAt.startOf('minute');
    const windowEnd = windowStart.plus({ minutes: aggregationWindowMin });
    const existing = groups.find((group) => candidate.scheduleAt <= group.windowEnd);
    if (existing) {
      existing.items.push(candidate);
      existing.windowEnd = DateTime.max(existing.windowEnd, windowEnd);
    } else {
      groups.push({ windowStart, windowEnd, items: [candidate] });
    }
  }
  return groups;
}

function hasReminderBeenSent(windowStart: DateTime, mode: ReminderMode, taskIds: string[]): boolean {
  const row = db
    .prepare(
      'SELECT COUNT(*) as count FROM reminder_log WHERE windowStart = ? AND mode = ? AND taskIds = ?'
    )
    .get(windowStart.toISO(), mode, JSON.stringify(taskIds.sort())) as { count: number };
  return row.count > 0;
}

function logReminder(windowStart: DateTime, windowEnd: DateTime, mode: ReminderMode, taskIds: string[]) {
  db.prepare(
    'INSERT INTO reminder_log (ts, windowStart, windowEnd, mode, taskIds) VALUES (?, ?, ?, ?, ?)'
  ).run(DateTime.now().toISO(), windowStart.toISO(), windowEnd.toISO(), mode, JSON.stringify(taskIds.sort()));
}

function sendReminder(group: { windowStart: DateTime; windowEnd: DateTime; items: ReminderCandidate[] }) {
  const taskIds = group.items.map((item) => item.task.id);
  const mode: ReminderMode = group.items.some((item) => item.mode === 'popup') ? 'popup' : 'silent';
  if (hasReminderBeenSent(group.windowStart, mode, taskIds)) {
    return;
  }
  logReminder(group.windowStart, group.windowEnd, mode, taskIds);
  console.info('[Reminder]', {
    mode,
    windowStart: group.windowStart.toISO(),
    windowEnd: group.windowEnd.toISO(),
    tasks: group.items.map((item) => ({ id: item.task.id, title: item.task.title }))
  });
}

export function runReminderSweep(now = DateTime.now().setZone(process.env.APP_TZ || 'Australia/Sydney')) {
  const tasks = listTasks();
  if (!tasks.length) return;
  const prefs = getUserPreferences();
  const candidates = computeReminderCandidates(tasks, now);
  const groups = groupCandidates(candidates, now, prefs.aggregationWindowMin);
  for (const group of groups) {
    sendReminder(group);
  }
}

let intervalHandle: NodeJS.Timeout | undefined;

export function ensureReminderScheduler() {
  if (intervalHandle) return;
  intervalHandle = setInterval(() => {
    try {
      runReminderSweep();
    } catch (error) {
      console.error('Reminder sweep failed', error);
    }
  }, 60_000);
}
