export type TaskStatus = 'TODO' | 'DOING' | 'DONE';
export type TaskPriority = 'low' | 'med' | 'high';
export type TaskFlexibility = 'strict' | '±15m' | '±30m' | '±2h';
export type ReminderMode = 'silent' | 'popup';

export interface ReminderPolicyEntry {
  offsetMin: number;
  mode: ReminderMode;
}

export interface TaskRecord {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  due: string | null;
  start: string | null;
  durationMin: number | null;
  flexibility: TaskFlexibility;
  remindPolicy: ReminderPolicyEntry[];
  createdAt: string;
  updatedAt: string;
  source: 'nlp' | 'manual';
}

export interface TaskInput {
  title: string;
  notes?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  due?: string | null;
  start?: string | null;
  durationMin?: number | null;
  flexibility?: TaskFlexibility;
  remindPolicy?: ReminderPolicyEntry[];
  source?: 'nlp' | 'manual';
}

export interface UserPreferences {
  workHours: Record<string, { start: string; end: string }>;
  focusBlocks: Array<{ start: string; end: string; weekday: number }>;
  quietHours: Array<{ start: string; end: string }>;
  defaultReminder: ReminderPolicyEntry;
  aggregationWindowMin: number;
  timezone: string;
}

export interface ReminderWindow {
  windowStart: string;
  windowEnd: string;
  mode: ReminderMode;
  taskIds: string[];
}
