import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';
import db from './client';
import type { ReminderPolicyEntry, TaskInput, TaskRecord, TaskStatus } from './types';

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapRow(row: any): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? null,
    status: row.status as TaskStatus,
    priority: row.priority,
    tags: parseJson<string[]>(row.tags, []),
    due: row.due ?? null,
    start: row.start ?? null,
    durationMin: row.durationMin ?? null,
    flexibility: row.flexibility,
    remindPolicy: parseJson<ReminderPolicyEntry[]>(row.remindPolicy, []),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    source: row.source
  };
}

export function listTasks(): TaskRecord[] {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY due IS NULL, due ASC').all();
  return rows.map(mapRow);
}

export function getTask(id: string): TaskRecord | null {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return row ? mapRow(row) : null;
}

export interface ListOptions {
  filter?: 'today' | 'upcoming' | 'overdue';
  now?: DateTime;
}

export function listTasksWithFilter(options: ListOptions = {}): TaskRecord[] {
  const { filter, now = DateTime.now().setZone(process.env.APP_TZ || 'Australia/Sydney') } = options;
  let query = 'SELECT * FROM tasks';
  const params: any[] = [];
  if (filter === 'today') {
    const start = now.startOf('day').toISO();
    const end = now.endOf('day').toISO();
    query += ' WHERE (due BETWEEN ? AND ?) OR (start BETWEEN ? AND ?)';
    params.push(start, end, start, end);
  } else if (filter === 'overdue') {
    const bound = now.toISO();
    query += ' WHERE status != "DONE" AND due IS NOT NULL AND due < ?';
    params.push(bound);
  } else if (filter === 'upcoming') {
    const bound = now.plus({ days: 7 }).toISO();
    query += ' WHERE due IS NOT NULL AND due BETWEEN ? AND ?';
    params.push(now.toISO(), bound);
  }
  query += ' ORDER BY due IS NULL, due ASC';
  const rows = db.prepare(query).all(...params);
  return rows.map(mapRow);
}

export function searchTasks(query: string): TaskRecord[] {
  const rows = db
    .prepare('SELECT * FROM tasks WHERE title LIKE ? OR notes LIKE ? ORDER BY updatedAt DESC LIMIT 50')
    .all(`%${query}%`, `%${query}%`);
  return rows.map(mapRow);
}

export function createTask(input: TaskInput): TaskRecord {
  const now = DateTime.now().toISO();
  const id = `tsk_${nanoid(12)}`;
  const data = {
    id,
    title: input.title,
    notes: input.notes ?? null,
    status: input.status ?? 'TODO',
    priority: input.priority ?? 'med',
    tags: JSON.stringify(input.tags ?? []),
    due: input.due ?? null,
    start: input.start ?? null,
    durationMin: input.durationMin ?? null,
    flexibility: input.flexibility ?? 'strict',
    remindPolicy: JSON.stringify(input.remindPolicy ?? []),
    createdAt: now,
    updatedAt: now,
    source: input.source ?? 'manual'
  };
  db.prepare(
    `INSERT INTO tasks (id, title, notes, status, priority, tags, due, start, durationMin, flexibility, remindPolicy, createdAt, updatedAt, source)
     VALUES (@id, @title, @notes, @status, @priority, @tags, @due, @start, @durationMin, @flexibility, @remindPolicy, @createdAt, @updatedAt, @source)`
  ).run(data);
  return mapRow(data);
}

export function updateTask(id: string, patch: Partial<TaskInput>): TaskRecord {
  const existing = getTask(id);
  if (!existing) {
    throw new Error('Task not found');
  }
  const updated = {
    ...existing,
    ...patch,
    tags: patch.tags ?? existing.tags,
    remindPolicy: patch.remindPolicy ?? existing.remindPolicy,
    updatedAt: DateTime.now().toISO()
  };
  db.prepare(
    `UPDATE tasks SET title=@title, notes=@notes, status=@status, priority=@priority, tags=@tags, due=@due, start=@start, durationMin=@durationMin, flexibility=@flexibility, remindPolicy=@remindPolicy, updatedAt=@updatedAt, source=@source WHERE id=@id`
  ).run({
    ...updated,
    tags: JSON.stringify(updated.tags),
    remindPolicy: JSON.stringify(updated.remindPolicy)
  });
  return getTask(id)!;
}

export function deleteTask(id: string): void {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function logAudit(action: string, payload: Record<string, unknown>): void {
  db.prepare('INSERT INTO audit_log (ts, action, payload) VALUES (?, ?, ?)').run(
    DateTime.now().toISO(),
    action,
    JSON.stringify(payload)
  );
}

export function listAuditLogs(limit = 100) {
  return db
    .prepare('SELECT ts, action, payload FROM audit_log ORDER BY ts DESC LIMIT ?')
    .all(limit)
    .map((row) => ({ ...row, payload: parseJson(row.payload, {}) }));
}
