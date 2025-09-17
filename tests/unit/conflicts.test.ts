import { describe, it, expect } from 'vitest';
import { detectConflicts } from '../../src/server/logic/conflicts';
import { getUserPreferences } from '../../src/server/db/userPrefs';
import { createTask } from '../../src/server/db/tasks';
import { DateTime } from 'luxon';

const timezone = 'Australia/Sydney';

describe('detectConflicts', () => {
  it('无冲突返回空数组', () => {
    const prefs = getUserPreferences();
    const conflicts = detectConflicts(
      {
        title: '正常任务',
        start: DateTime.fromISO('2024-05-20T10:00:00', { zone: timezone }).toISO(),
        durationMin: 60
      },
      prefs,
      []
    );
    expect(conflicts).toHaveLength(0);
  });

  it('识别安静时段冲突', () => {
    const prefs = getUserPreferences();
    const conflicts = detectConflicts(
      {
        title: '深夜任务',
        due: DateTime.fromISO('2024-05-20T23:30:00', { zone: timezone }).toISO()
      },
      prefs,
      []
    );
    expect(conflicts.some((conflict) => conflict.type === 'quiet')).toBe(true);
  });

  it('识别工作时间之外的安排', () => {
    const prefs = getUserPreferences();
    const conflicts = detectConflicts(
      {
        title: '清晨任务',
        start: DateTime.fromISO('2024-05-20T05:00:00', { zone: timezone }).toISO(),
        durationMin: 30
      },
      prefs,
      []
    );
    expect(conflicts.some((conflict) => conflict.type === 'worktime')).toBe(true);
  });

  it('识别与现有任务的重叠', () => {
    const prefs = getUserPreferences();
    const existing = createTask({
      title: '现有任务',
      start: DateTime.fromISO('2024-05-20T14:00:00', { zone: timezone }).toISO(),
      durationMin: 60
    });
    const conflicts = detectConflicts(
      {
        title: '重叠任务',
        start: DateTime.fromISO('2024-05-20T14:30:00', { zone: timezone }).toISO(),
        durationMin: 45
      },
      prefs,
      [existing]
    );
    expect(conflicts.some((conflict) => conflict.type === 'overlap')).toBe(true);
  });
});
