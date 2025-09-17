import { describe, it, expect } from 'vitest';
import { generateAdjustmentOptions } from '../../src/server/logic/suggestions';
import { getUserPreferences } from '../../src/server/db/userPrefs';
import { createTask } from '../../src/server/db/tasks';
import { DateTime } from 'luxon';

const timezone = 'Australia/Sydney';

describe('generateAdjustmentOptions', () => {
  it('提供至少一个候选方案', () => {
    const prefs = getUserPreferences();
    const options = generateAdjustmentOptions(
      {
        start: DateTime.fromISO('2024-05-20T10:00:00', { zone: timezone }).toISO(),
        durationMin: 60,
        flexibility: '±30m'
      },
      prefs,
      []
    );
    expect(options.length).toBeGreaterThan(0);
  });

  it('候选应避开重叠任务', () => {
    const prefs = getUserPreferences();
    const existing = createTask({
      title: '阻塞任务',
      start: DateTime.fromISO('2024-05-20T10:30:00', { zone: timezone }).toISO(),
      durationMin: 60
    });
    const options = generateAdjustmentOptions(
      {
        start: DateTime.fromISO('2024-05-20T10:30:00', { zone: timezone }).toISO(),
        durationMin: 60,
        flexibility: '±30m'
      },
      prefs,
      [existing]
    );
    expect(options.every((option) => option.start !== existing.start)).toBe(true);
  });

  it('在缺少可行方案时提供次日建议', () => {
    const prefs = getUserPreferences();
    const options = generateAdjustmentOptions(
      {
        due: DateTime.fromISO('2024-05-20T23:30:00', { zone: timezone }).toISO(),
        flexibility: '±15m'
      },
      prefs,
      []
    );
    expect(options.some((option) => option.due && option.due.includes('T09:00'))).toBe(true);
  });
});
