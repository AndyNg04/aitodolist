import { DateTime } from 'luxon';
import db from '../src/server/db/client';

const now = DateTime.now().setZone(process.env.APP_TZ || 'Australia/Sydney');

const tasks = [
  {
    id: 'seed-1',
    title: '准备产品汇报',
    notes: '整理关键指标，关注留存率',
    status: 'TODO',
    priority: 'high',
    tags: JSON.stringify(['演示', '周报']),
    due: now.plus({ days: 1 }).set({ hour: 17, minute: 0 }).toISO(),
    start: null,
    durationMin: 90,
    flexibility: '±30m',
    remindPolicy: JSON.stringify([
      { offsetMin: 120, mode: 'popup' },
      { offsetMin: 30, mode: 'silent' }
    ]),
    createdAt: now.minus({ days: 1 }).toISO(),
    updatedAt: now.minus({ days: 1 }).toISO(),
    source: 'manual'
  },
  {
    id: 'seed-2',
    title: 'UX 访谈回顾',
    notes: '复盘 HCI 研讨会',
    status: 'DOING',
    priority: 'med',
    tags: JSON.stringify(['研究']),
    due: now.plus({ days: 2 }).set({ hour: 15, minute: 0 }).toISO(),
    start: null,
    durationMin: 60,
    flexibility: '±2h',
    remindPolicy: JSON.stringify([{ offsetMin: 60, mode: 'popup' }]),
    createdAt: now.minus({ days: 3 }).toISO(),
    updatedAt: now.minus({ days: 2 }).toISO(),
    source: 'manual'
  }
];

db.prepare('DELETE FROM tasks WHERE id LIKE "seed-%"').run();
const insert = db.prepare(`
  INSERT INTO tasks (id, title, notes, status, priority, tags, due, start, durationMin, flexibility, remindPolicy, createdAt, updatedAt, source)
  VALUES (@id, @title, @notes, @status, @priority, @tags, @due, @start, @durationMin, @flexibility, @remindPolicy, @createdAt, @updatedAt, @source)
`);
for (const task of tasks) {
  insert.run(task);
}
console.log('Seeded example tasks');
