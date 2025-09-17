import { DateTime } from 'luxon';
import db from './client';

export interface SevenDayMetrics {
  completionRate: number;
  modificationCount: number;
  reopenRate: number;
  averageCompletionMinutes: number;
  totalCreated: number;
  totalCompleted: number;
}

export function getSevenDayMetrics(now = DateTime.now()): SevenDayMetrics {
  const windowStart = now.minus({ days: 7 }).toISO();
  const created = db
    .prepare('SELECT COUNT(*) as count FROM tasks WHERE createdAt >= ?')
    .get(windowStart) as { count: number };
  const completed = db
    .prepare("SELECT id, createdAt, updatedAt FROM tasks WHERE status = 'DONE' AND updatedAt >= ?")
    .all(windowStart) as Array<{ id: string; createdAt: string; updatedAt: string }>;
  const modifications = db
    .prepare("SELECT COUNT(*) as count FROM audit_log WHERE ts >= ? AND action = 'task.updated'")
    .get(windowStart) as { count: number };
  const reopen = db
    .prepare("SELECT COUNT(*) as count FROM audit_log WHERE ts >= ? AND action = 'task.reopened'")
    .get(windowStart) as { count: number };

  const completionRate = created.count === 0 ? 0 : completed.length / created.count;
  const durations = completed
    .map((task) => {
      const createdAt = DateTime.fromISO(task.createdAt);
      const updatedAt = DateTime.fromISO(task.updatedAt);
      if (!createdAt.isValid || !updatedAt.isValid) return null;
      return updatedAt.diff(createdAt, 'minutes').minutes;
    })
    .filter((d): d is number => typeof d === 'number' && Number.isFinite(d));
  const averageCompletionMinutes = durations.length
    ? durations.reduce((acc, curr) => acc + curr, 0) / durations.length
    : 0;

  return {
    completionRate,
    modificationCount: modifications.count,
    reopenRate: completed.length === 0 ? 0 : reopen.count / completed.length,
    averageCompletionMinutes,
    totalCreated: created.count,
    totalCompleted: completed.length
  };
}
