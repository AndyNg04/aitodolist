import { DateTime } from 'luxon';
import type { TaskRecord, UserPreferences } from '../db/types';
import { DEFAULT_TIMEZONE } from './time';

export type ConflictType = 'worktime' | 'quiet' | 'overlap';

export interface Conflict {
  type: ConflictType;
  detail: string;
}

interface DraftLike {
  start?: string | null;
  due?: string | null;
  durationMin?: number | null;
  title?: string;
}

function parseTime(value: string, timezone: string) {
  const dt = DateTime.fromISO(value, { zone: timezone });
  return dt.isValid ? dt : null;
}

function windowForTask(task: DraftLike, timezone: string) {
  const start = task.start ? parseTime(task.start, timezone) : null;
  const due = task.due ? parseTime(task.due, timezone) : null;
  if (start && task.durationMin) {
    return { start, end: start.plus({ minutes: task.durationMin }), anchor: start };
  }
  if (start && due) {
    return { start, end: due, anchor: start };
  }
  if (due) {
    const duration = task.durationMin ?? 30;
    return { start: due.minus({ minutes: duration }), end: due, anchor: due };
  }
  return null;
}

function isWithinQuiet(dt: DateTime, prefs: UserPreferences) {
  return prefs.quietHours.some((range) => {
    const [startHour, startMinute] = range.start.split(':').map(Number);
    const [endHour, endMinute] = range.end.split(':').map(Number);
    const start = dt.set({ hour: startHour, minute: startMinute });
    let end = dt.set({ hour: endHour, minute: endMinute });
    if (range.start > range.end) {
      if (dt < start) {
        const previous = dt.minus({ days: 1 }).set({ hour: startHour, minute: startMinute });
        return dt <= end || dt >= previous;
      }
      end = end.plus({ days: 1 });
      return dt >= start || dt <= end;
    }
    return dt >= start && dt <= end;
  });
}

const weekdayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function isOutsideWorkHours(dt: DateTime, prefs: UserPreferences) {
  const key = weekdayNames[dt.weekday - 1];
  const range = prefs.workHours[key];
  if (!range) return true;
  const [startHour, startMinute] = range.start.split(':').map(Number);
  const [endHour, endMinute] = range.end.split(':').map(Number);
  const start = dt.set({ hour: startHour, minute: startMinute });
  const end = dt.set({ hour: endHour, minute: endMinute });
  return dt < start || dt > end;
}

export function detectConflicts(
  draft: DraftLike,
  prefs: UserPreferences,
  existingTasks: TaskRecord[],
  timezone = DEFAULT_TIMEZONE
): Conflict[] {
  const conflicts: Conflict[] = [];
  const window = windowForTask(draft, timezone);
  if (!window) {
    return conflicts;
  }

  if (isWithinQuiet(window.anchor, prefs)) {
    conflicts.push({
      type: 'quiet',
      detail: `${window.anchor.toFormat('ccc HH:mm')} 处于安静时段`
    });
  }

  if (isOutsideWorkHours(window.anchor, prefs)) {
    conflicts.push({
      type: 'worktime',
      detail: `${window.anchor.toFormat('ccc HH:mm')} 超出设定工作时段`
    });
  }

  for (const task of existingTasks) {
    if (task.status === 'DONE') continue;
    const other = windowForTask(task, timezone);
    if (!other) continue;
    const overlaps = window.start < other.end && other.start < window.end;
    if (overlaps) {
      conflicts.push({
        type: 'overlap',
        detail: `与「${task.title}」(${other.start.toFormat('ccc HH:mm')}–${other.end.toFormat('HH:mm')})重叠`
      });
      break;
    }
  }

  return conflicts;
}
