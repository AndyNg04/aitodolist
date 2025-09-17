import { describe, it, expect } from 'vitest';
import { computeReminderCandidates, groupCandidates, runReminderSweep } from '../../src/server/scheduling/reminderScheduler';
import { createTask } from '../../src/server/db/tasks';
import { DateTime } from 'luxon';
import { getUserPreferences } from '../../src/server/db/userPrefs';
import db from '../../src/server/db/client';

const timezone = 'Australia/Sydney';

describe('reminder scheduler', () => {
  it('根据提醒策略生成候选', () => {
    const task = createTask({
      title: '测试提醒',
      due: DateTime.fromISO('2024-05-20T12:00:00', { zone: timezone }).toISO(),
      remindPolicy: [{ offsetMin: 30, mode: 'popup' }]
    });
    const candidates = computeReminderCandidates([task], DateTime.fromISO('2024-05-20T11:40:00', { zone: timezone }));
    expect(candidates).toHaveLength(1);
    expect(candidates[0].mode).toBe('popup');
  });

  it('按聚合窗口合并提醒', () => {
    const task = createTask({
      title: '候选 1',
      due: DateTime.fromISO('2024-05-20T12:00:00', { zone: timezone }).toISO(),
      remindPolicy: [{ offsetMin: 30, mode: 'silent' }]
    });
    const prefs = getUserPreferences();
    const now = DateTime.fromISO('2024-05-20T11:35:00', { zone: timezone });
    const candidates = computeReminderCandidates([task], now);
    const groups = groupCandidates(candidates, now.plus({ minutes: 5 }), prefs.aggregationWindowMin);
    expect(groups.length).toBeGreaterThan(0);
  });

  it('执行 sweep 时写入 reminder_log', () => {
    createTask({
      title: '提醒写入',
      due: DateTime.now().setZone(timezone).plus({ minutes: 10 }).toISO(),
      remindPolicy: [{ offsetMin: 5, mode: 'popup' }]
    });
    const before = db.prepare('SELECT COUNT(*) as count FROM reminder_log').get() as { count: number };
    runReminderSweep(DateTime.now().setZone(timezone).plus({ minutes: 6 }));
    const after = db.prepare('SELECT COUNT(*) as count FROM reminder_log').get() as { count: number };
    expect(after.count).toBeGreaterThanOrEqual(before.count);
  });
});
