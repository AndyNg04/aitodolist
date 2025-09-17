import * as chrono from 'chrono-node';
import { DateTime } from 'luxon';
import { listTasks, createTask as dbCreateTask, updateTask as dbUpdateTask, deleteTask as dbDeleteTask, searchTasks as dbSearchTasks, logAudit, getTask } from '../db/tasks';
import type { TaskInput, TaskRecord } from '../db/types';
import { getUserPreferences } from '../db/userPrefs';
import { detectConflicts } from '../logic/conflicts';
import { generateAdjustmentOptions } from '../logic/suggestions';
import { DEFAULT_TIMEZONE, normalizeTitle } from '../logic/time';

export interface ExtractTaskIntentParams {
  inputText: string;
  nowISO: string;
  timezone: string;
  userPrefs?: Partial<ReturnType<typeof getUserPreferences>>;
}

export interface ExtractTaskIntentResult {
  title: string;
  notes?: string;
  due?: string;
  start?: string;
  durationMin?: number;
  priority?: 'low' | 'med' | 'high';
  tags?: string[];
  flexibility?: 'strict' | '±15m' | '±30m' | '±2h';
  recurrence?: { rrule: string } | null;
  reminders?: Array<{ offsetMin: number; mode: 'silent' | 'popup' }>;
  conflicts?: Array<{ type: 'worktime' | 'quiet' | 'overlap'; detail: string }>;
  rationale: string;
}

function pickPriority(text: string): 'low' | 'med' | 'high' {
  if (/高优先级|重要|紧急/.test(text)) return 'high';
  if (/低优先级|随意|不急/.test(text)) return 'low';
  return 'med';
}

function pickFlexibility(text: string): 'strict' | '±15m' | '±30m' | '±2h' {
  if (/必须|固定|不变/.test(text)) return 'strict';
  if (/如果冲突|灵活|前后/.test(text)) return '±2h';
  if (/可以提前|顺延|小幅/.test(text)) return '±30m';
  return '±15m';
}

function extractTags(text: string): string[] {
  const tags = new Set<string>();
  const hashMatches = text.match(/#([\p{L}\p{N}_]+)/gu) || [];
  for (const match of hashMatches) {
    tags.add(match.replace('#', ''));
  }
  if (/学习/.test(text)) tags.add('学习');
  if (/报告|汇报/.test(text)) tags.add('报告');
  return Array.from(tags);
}

function extractNotes(text: string): string | undefined {
  const noteMatch = text.match(/备注[:：](.+)/);
  if (noteMatch) {
    return noteMatch[1].trim();
  }
  return undefined;
}

function parseReminder(text: string, fallback: { offsetMin: number; mode: 'silent' | 'popup' }) {
  const match = text.match(/提前?(\d{1,3})\s*分钟/);
  if (match) {
    const offset = Number.parseInt(match[1], 10);
    return [{ offsetMin: offset, mode: text.includes('静默') ? 'silent' : 'popup' as const }];
  }
  return [fallback];
}

function removeTimeExpressions(text: string, results: chrono.ParsedResult[]) {
  let cleaned = text;
  for (const result of results) {
    cleaned = cleaned.replace(result.text, ' ');
  }
  cleaned = cleaned.replace(/提醒我|优先级[高低]?|如果冲突.*$/g, ' ');
  return normalizeTitle(cleaned);
}

export function extractTaskIntent(
  params: ExtractTaskIntentParams
): ExtractTaskIntentResult {
  const timezone = params.timezone || DEFAULT_TIMEZONE;
  const reference = DateTime.fromISO(params.nowISO, { zone: timezone });
  const prefs = params.userPrefs ? { ...getUserPreferences(), ...params.userPrefs } : getUserPreferences();
  const results = chrono.parse(params.inputText, reference.toJSDate(), { forwardDate: true });

  let start: string | undefined;
  let due: string | undefined;
  let durationMin: number | undefined;

  if (results.length > 0) {
    const first = results[0];
    if (first.start) {
      const startDt = DateTime.fromJSDate(first.start.date()).setZone(timezone);
      if (first.end) {
        const endDt = DateTime.fromJSDate(first.end.date()).setZone(timezone);
        start = startDt.toISO();
        due = endDt.toISO();
        durationMin = Math.max(15, Math.round(endDt.diff(startDt, 'minutes').minutes));
      } else {
        due = startDt.toISO();
      }
    }
  }

  const title = removeTimeExpressions(params.inputText, results) || params.inputText.trim();
  const priority = pickPriority(params.inputText);
  const flexibility = pickFlexibility(params.inputText);
  const tags = extractTags(params.inputText);
  const notes = extractNotes(params.inputText);
  const reminders = parseReminder(params.inputText, prefs.defaultReminder);

  const draft: Partial<TaskRecord> = {
    title,
    due: due ?? null,
    start: start ?? null,
    durationMin: durationMin ?? null,
    flexibility
  } as Partial<TaskRecord>;

  const conflicts = detectConflicts(draft, prefs, listTasks(), timezone);

  const rationaleParts: string[] = [];
  if (due || start) {
    const anchor = start ? DateTime.fromISO(start).toFormat('ccc HH:mm') : DateTime.fromISO(due!).toFormat('ccc HH:mm');
    rationaleParts.push(`时间：解析为 ${anchor}`);
  } else {
    rationaleParts.push('时间：未在文本中找到明确时间，建议补充截止或开始时间');
  }
  rationaleParts.push(`优先级：关键词判断为 ${priority}`);
  rationaleParts.push(`提醒：按照 ${reminders
    .map((r) => `提前${r.offsetMin}分钟(${r.mode === 'popup' ? '硬提醒' : '软提醒'})`)
    .join('，')} `);
  if (conflicts.length) {
    rationaleParts.push(`冲突：${conflicts.map((c) => c.detail).join('；')}`);
  }

  return {
    title,
    notes,
    due,
    start,
    durationMin,
    priority,
    tags,
    flexibility,
    recurrence: null,
    reminders,
    conflicts,
    rationale: rationaleParts.map((line) => `- ${line}`).join('\n')
  };
}

export function suggestScheduleAdjustments(params: {
  draft: {
    start?: string | null;
    due?: string | null;
    durationMin?: number | null;
    flexibility?: 'strict' | '±15m' | '±30m' | '±2h';
  };
}): Array<{
  start?: string;
  due?: string;
  durationMin?: number;
  flexibility?: 'strict' | '±15m' | '±30m' | '±2h';
  rationale: string;
}> {
  const prefs = getUserPreferences();
  const existing = listTasks();
  return generateAdjustmentOptions(params.draft, prefs, existing, prefs.timezone);
}

export function createTask(input: TaskInput) {
  const task = dbCreateTask(input);
  logAudit('task.created', { id: task.id, title: task.title, source: input.source ?? 'manual' });
  return { id: task.id, saved: true };
}

export function updateTask(id: string, patch: Partial<TaskInput>) {
  const before = getTask(id);
  const task = dbUpdateTask(id, patch);
  if (before?.status === 'DONE' && patch.status && patch.status !== 'DONE') {
    logAudit('task.reopened', { id });
  } else {
    logAudit('task.updated', { id, patch });
  }
  return task;
}

export function deleteTask(id: string) {
  dbDeleteTask(id);
  logAudit('task.deleted', { id });
  return { ok: true };
}

export function listTasksTool() {
  return listTasks();
}

export function searchTasks(query: string) {
  return dbSearchTasks(query);
}
