import db from '../src/server/db/client';
import { SCHEMA_SQL } from '../src/server/db/schema';

console.log('Applying schema...');
db.exec(SCHEMA_SQL);

const existing = db.prepare('SELECT COUNT(*) as count FROM user_prefs').get() as { count: number };
if (existing.count === 0) {
  db.prepare(
    `INSERT INTO user_prefs (id, workHours, focusBlocks, quietHours, defaultReminder, aggregationWindowMin, timezone)
     VALUES (1, @workHours, @focusBlocks, @quietHours, @defaultReminder, @aggregationWindowMin, @timezone)`
  ).run({
    workHours: JSON.stringify({
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' }
    }),
    focusBlocks: JSON.stringify([]),
    quietHours: JSON.stringify([
      { start: '22:00', end: '07:00' }
    ]),
    defaultReminder: JSON.stringify({ offsetMin: 30, mode: 'popup' }),
    aggregationWindowMin: 45,
    timezone: process.env.APP_TZ || 'Australia/Sydney'
  });
  console.log('Inserted default user prefs');
}

console.log('Database ready');
