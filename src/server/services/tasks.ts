import { DateTime } from 'luxon';
import { createTask, deleteTask, listTasksWithFilter, searchTasks as searchTaskDb, updateTask } from '../db/tasks';
import type { TaskInput, TaskRecord } from '../db/types';
import { logAudit } from '../db/tasks';
import { ensureReminderScheduler } from '../scheduling/reminderScheduler';

ensureReminderScheduler();

export function listByView(view: 'all' | 'today' | 'upcoming' | 'overdue' = 'all'): TaskRecord[] {
  if (view === 'all') {
    return listTasksWithFilter();
  }
  return listTasksWithFilter({ filter: view, now: DateTime.now() });
}

export function createTaskFromIntent(input: TaskInput) {
  const record = createTask(input);
  logAudit('task.created', { id: record.id, title: record.title, source: input.source ?? 'manual' });
  return record;
}

export function updateTaskWithAudit(id: string, patch: Partial<TaskInput>) {
  const updated = updateTask(id, patch);
  logAudit('task.updated', { id, patch });
  return updated;
}

export function deleteTaskWithAudit(id: string) {
  deleteTask(id);
  logAudit('task.deleted', { id });
}

export function searchTasks(query: string) {
  return searchTaskDb(query);
}
