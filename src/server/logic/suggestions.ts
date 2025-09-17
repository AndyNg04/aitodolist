import { DateTime, DurationLikeObject } from 'luxon';
import type { TaskFlexibility, TaskRecord, UserPreferences } from '../db/types';
import { DEFAULT_TIMEZONE } from './time';
import { detectConflicts } from './conflicts';

export interface AdjustmentDraft {
  start?: string | null;
  due?: string | null;
  durationMin?: number | null;
  flexibility?: TaskFlexibility;
}

export interface AdjustmentOption {
  start?: string;
  due?: string;
  durationMin?: number;
  flexibility?: TaskFlexibility;
  rationale: string;
}

const FLEX_WINDOWS: Record<TaskFlexibility, number> = {
  strict: 0,
  '±15m': 15,
  '±30m': 30,
  '±2h': 120
};

function moveByFlex(flex: TaskFlexibility | undefined, step: number): DurationLikeObject {
  const window = FLEX_WINDOWS[flex ?? '±30m'] || 30;
  return { minutes: Math.min(step * window, 4 * window) };
}

export function generateAdjustmentOptions(
  draft: AdjustmentDraft,
  prefs: UserPreferences,
  existing: TaskRecord[],
  timezone = DEFAULT_TIMEZONE
): AdjustmentOption[] {
  const base = draft.start ?? draft.due;
  if (!base) return [];
  const baseTime = DateTime.fromISO(base, { zone: timezone });
  if (!baseTime.isValid) return [];
  const duration = draft.durationMin ?? 30;
  const options: AdjustmentOption[] = [];
  const visited = new Set<string>();
  const flex = draft.flexibility ?? '±30m';

  function pushOption(dt: DateTime, rationale: string) {
    const due = draft.start ? dt.plus({ minutes: duration }) : dt;
    const start = draft.start ? dt : null;
    const key = `${start?.toISO() ?? ''}|${due.toISO()}`;
    if (visited.has(key)) return;
    visited.add(key);
    const candidate = {
      start: start?.toISO(),
      due: due.toISO(),
      durationMin: duration,
      flexibility: flex,
      rationale
    };
    const conflicts = detectConflicts(candidate, prefs, existing, timezone);
    if (conflicts.length === 0) {
      options.push(candidate);
    }
  }

  const increments = [1, 2, -1, 3, -2, 4];
  for (const step of increments) {
    const shift = moveByFlex(flex, Math.abs(step));
    const minutes = (shift as { minutes?: number }).minutes ?? 0;
    const nextTime = step >= 0 ? baseTime.plus(shift) : baseTime.minus(shift);
    const label = step >= 0 ? '顺延' : '提前';
    pushOption(nextTime, `${label} ${minutes} 分钟，避开冲突`);
    if (options.length >= 4) break;
  }

  if (options.length < 2) {
    // fallback: next workday morning
    const nextMorning = baseTime.plus({ days: 1 }).set({ hour: 9, minute: 0 });
    pushOption(nextMorning, '次日 09:00 开始，保证在工作时间内');
  }

  return options.slice(0, 4);
}
