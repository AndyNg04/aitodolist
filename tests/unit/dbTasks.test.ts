import { describe, it, expect } from 'vitest';
import { createTask, listTasks, updateTask, deleteTask } from '../../src/server/db/tasks';
import { DateTime } from 'luxon';

const timezone = 'Australia/Sydney';

describe('db tasks', () => {
  it('创建并列出任务', () => {
    const task = createTask({
      title: '数据库测试',
      due: DateTime.now().setZone(timezone).toISO()
    });
    const tasks = listTasks();
    expect(tasks.map((t) => t.id)).toContain(task.id);
  });

  it('更新任务状态', () => {
    const task = createTask({ title: '更新状态' });
    const updated = updateTask(task.id, { status: 'DONE' });
    expect(updated.status).toBe('DONE');
  });

  it('删除任务', () => {
    const task = createTask({ title: '待删除' });
    deleteTask(task.id);
    const tasks = listTasks();
    expect(tasks.some((t) => t.id === task.id)).toBe(false);
  });
});
