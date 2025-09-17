export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'TODO' CHECK(status IN ('TODO','DOING','DONE')),
  priority TEXT NOT NULL DEFAULT 'med' CHECK(priority IN ('low','med','high')),
  tags TEXT NOT NULL DEFAULT '[]',
  due TEXT,
  start TEXT,
  durationMin INTEGER,
  flexibility TEXT NOT NULL DEFAULT 'strict' CHECK(flexibility IN ('strict','±15m','±30m','±2h')),
  remindPolicy TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('nlp','manual'))
);

CREATE TABLE IF NOT EXISTS recurrence (
  taskId TEXT PRIMARY KEY,
  rrule TEXT NOT NULL,
  FOREIGN KEY(taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_prefs (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  workHours TEXT NOT NULL DEFAULT '{}',
  focusBlocks TEXT NOT NULL DEFAULT '[]',
  quietHours TEXT NOT NULL DEFAULT '[]',
  defaultReminder TEXT NOT NULL DEFAULT '{"offsetMin":30,"mode":"popup"}',
  aggregationWindowMin INTEGER NOT NULL DEFAULT 30,
  timezone TEXT NOT NULL DEFAULT 'Australia/Sydney'
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminder_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  windowStart TEXT NOT NULL,
  windowEnd TEXT NOT NULL,
  mode TEXT NOT NULL,
  taskIds TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS integration_google (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  tokens TEXT,
  lastSyncAt TEXT,
  syncMapping TEXT NOT NULL DEFAULT '{}'
);
`;
