import { z } from 'zod';
import db from './client';
import type { UserPreferences } from './types';

const quietRangeSchema = z.object({ start: z.string(), end: z.string() });
const workHoursSchema = z.record(z.object({ start: z.string(), end: z.string() }));
const focusBlockSchema = z
  .object({ start: z.string(), end: z.string(), weekday: z.number().int().min(0).max(6) })
  .array();
const reminderSchema = z.object({ offsetMin: z.number().int().nonnegative(), mode: z.enum(['silent', 'popup']) });

const prefsSchema = z.object({
  workHours: workHoursSchema,
  focusBlocks: focusBlockSchema,
  quietHours: quietRangeSchema.array(),
  defaultReminder: reminderSchema,
  aggregationWindowMin: z.number().int().min(5).max(240),
  timezone: z.string()
});

export function getUserPreferences(): UserPreferences {
  const row = db.prepare('SELECT * FROM user_prefs WHERE id = 1').get();
  if (!row) {
    throw new Error('User preferences missing');
  }
  const parsed = prefsSchema.parse({
    workHours: JSON.parse(row.workHours),
    focusBlocks: JSON.parse(row.focusBlocks),
    quietHours: JSON.parse(row.quietHours),
    defaultReminder: JSON.parse(row.defaultReminder),
    aggregationWindowMin: row.aggregationWindowMin,
    timezone: row.timezone
  });
  return parsed;
}

export function updateUserPreferences(patch: Partial<UserPreferences>): UserPreferences {
  const current = getUserPreferences();
  const merged: UserPreferences = {
    ...current,
    ...patch,
    workHours: patch.workHours ?? current.workHours,
    focusBlocks: patch.focusBlocks ?? current.focusBlocks,
    quietHours: patch.quietHours ?? current.quietHours,
    defaultReminder: patch.defaultReminder ?? current.defaultReminder,
    aggregationWindowMin: patch.aggregationWindowMin ?? current.aggregationWindowMin,
    timezone: patch.timezone ?? current.timezone
  };
  const validated = prefsSchema.parse(merged);
  db.prepare(
    `UPDATE user_prefs SET workHours=@workHours, focusBlocks=@focusBlocks, quietHours=@quietHours, defaultReminder=@defaultReminder, aggregationWindowMin=@aggregationWindowMin, timezone=@timezone WHERE id = 1`
  ).run({
    workHours: JSON.stringify(validated.workHours),
    focusBlocks: JSON.stringify(validated.focusBlocks),
    quietHours: JSON.stringify(validated.quietHours),
    defaultReminder: JSON.stringify(validated.defaultReminder),
    aggregationWindowMin: validated.aggregationWindowMin,
    timezone: validated.timezone
  });
  return validated;
}
