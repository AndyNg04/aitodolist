import DatabaseConstructor from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

function createDatabase() {
  const configuredPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'lumilist.db');
  const resolved =
    configuredPath === ':memory:'
      ? ':memory:'
      : path.isAbsolute(configuredPath)
          ? configuredPath
          : path.join(process.cwd(), configuredPath);
  if (resolved !== ':memory:') {
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
  }
  const db = new DatabaseConstructor(resolved);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

declare global {
  // eslint-disable-next-line no-var
  var __lumilistDb: ReturnType<typeof createDatabase> | undefined;
}

const db = globalThis.__lumilistDb ?? createDatabase();
if (!globalThis.__lumilistDb) {
  globalThis.__lumilistDb = db;
}

export default db;
