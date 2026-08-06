use std::path::Path;

use rusqlite::Connection;

/// Mirrors apps/electron-chat-app/src/main/db.ts and apps/bun-chat-app/src/server/db.ts —
/// same schema and migration shape, just opened via rusqlite instead of a JS driver.
pub fn open_database(data_dir: &Path) -> Connection {
    std::fs::create_dir_all(data_dir).expect("failed to create app data directory");
    let db_path = data_dir.join("encatch-mock.db");
    let conn = Connection::open(db_path).expect("failed to open sqlite database");
    conn.execute_batch("PRAGMA journal_mode = WAL;").ok();

    conn.execute_batch(
        "
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
        ",
    )
    .expect("failed to create schema");

    migrate_chat_columns(&conn);

    conn
}

/// Adds columns introduced after the initial release to any pre-existing local DB file.
fn migrate_chat_columns(conn: &Connection) {
    let mut stmt = conn.prepare("PRAGMA table_info(chats)").unwrap();
    let names: Vec<String> = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .unwrap()
        .filter_map(Result::ok)
        .collect();

    if !names.iter().any(|n| n == "pinned") {
        conn.execute_batch("ALTER TABLE chats ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0")
            .expect("failed to add pinned column");
    }
    if !names.iter().any(|n| n == "archived_at") {
        conn.execute_batch("ALTER TABLE chats ADD COLUMN archived_at INTEGER")
            .expect("failed to add archived_at column");
    }
}
