import { describe, it, expect } from 'vitest';
import { createTask, updateTask } from '../../src/server/db/tasks';
import { getSevenDayMetrics } from '../../src/server/db/metrics';
import db from '../../src/server/db/client';
import { DateTime } from 'luxon';

const timezone = 'Australia/Sydney';

describe('metrics', () => {
  it('计算完成率与数量', () => {
    const task = createTask({ title: '完成任务' });
    updateTask(task.id, { status: 'DONE' });
    const metrics = getSevenDayMetrics();
    expect(metrics.totalCreated).toBeGreaterThan(0);
    expect(metrics.totalCompleted).toBeGreaterThanOrEqual(1);
  });

  it('计算平均完成时长', () => {
    const task = createTask({ title: '耗时任务' });
    const createdAt = DateTime.now().minus({ hours: 2 }).toISO();
    const updatedAt = DateTime.now().toISO();
    db.prepare('UPDATE tasks SET createdAt = ?, updatedAt = ?, status = ? WHERE id = ?').run(
      createdAt,
      updatedAt,
      'DONE',
      task.id
    );
    const metrics = getSevenDayMetrics();
    expect(metrics.averageCompletionMinutes).toBeGreaterThan(0);
  });
});
