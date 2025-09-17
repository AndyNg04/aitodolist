import db from './client';
import { SCHEMA_SQL } from './schema';

export function resetDatabase() {
  db.exec('PRAGMA foreign_keys = OFF;');
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as Array<{ name: string }>;
  for (const table of tables) {
    db.prepare(`DROP TABLE IF EXISTS ${table.name}`).run();
  }
  db.exec(SCHEMA_SQL);
  db.prepare(
    `INSERT INTO user_prefs (id, workHours, focusBlocks, quietHours, defaultReminder, aggregationWindowMin, timezone)
     VALUES (1, ?, '[]', '[{"start":"22:00","end":"07:00"}]', '{"offsetMin":30,"mode":"popup"}', 45, 'Australia/Sydney')`
  ).run(
    JSON.stringify({
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' }
    })
  );
}
