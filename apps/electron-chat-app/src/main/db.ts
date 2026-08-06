import { app } from "electron"
import { join } from "node:path"
import Database from "better-sqlite3"

export function openDatabase(): Database.Database {
  const dbPath = join(app.getPath("userData"), "encatch-mock.db")
  const db = new Database(dbPath)
  db.pragma("journal_mode = WAL")

  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      archived_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      chat_id TEXT,
      message_id TEXT,
      rating TEXT,
      comment TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
  `)

  migrateChatColumns(db)

  return db
}

/** Adds columns introduced after the initial release to any pre-existing local DB file. */
function migrateChatColumns(db: Database.Database): void {
  const columns = db.prepare("PRAGMA table_info(chats)").all() as { name: string }[]
  const names = new Set(columns.map((c) => c.name))
  if (!names.has("pinned")) {
    db.exec("ALTER TABLE chats ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0")
  }
  if (!names.has("archived_at")) {
    db.exec("ALTER TABLE chats ADD COLUMN archived_at INTEGER")
  }
}
