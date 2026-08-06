import { homedir } from "node:os"
import { join } from "node:path"
import { mkdirSync } from "node:fs"
import { Database } from "bun:sqlite"

/** Mirrors apps/electron-chat-app/src/main/db.ts, swapping Electron's userData path for a plain XDG-ish data dir. */
export function openDatabase(): Database {
  const dataDir = join(homedir(), ".encatch-bun-chat-app")
  mkdirSync(dataDir, { recursive: true })
  const db = new Database(join(dataDir, "encatch-mock.db"))
  db.exec("PRAGMA journal_mode = WAL")

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
function migrateChatColumns(db: Database): void {
  const columns = db.query("PRAGMA table_info(chats)").all() as { name: string }[]
  const names = new Set(columns.map((c) => c.name))
  if (!names.has("pinned")) {
    db.exec("ALTER TABLE chats ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0")
  }
  if (!names.has("archived_at")) {
    db.exec("ALTER TABLE chats ADD COLUMN archived_at INTEGER")
  }
}
