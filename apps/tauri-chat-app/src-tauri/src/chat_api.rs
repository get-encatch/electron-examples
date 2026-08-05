use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{Connection, OptionalExtension};
use uuid::Uuid;

use crate::lorem::generate_lorem_reply;
use crate::models::{Chat, Feedback, FeedbackInput, Message, MessageRole, NavUser, SendMessageResult};
use crate::title::derive_chat_title;

/// Implements the shared ChatApi contract over rusqlite. Mirrors
/// apps/chat-app/src/main/chatApi.ts and apps/bun-chat-app/src/server/chatApi.ts
/// row-for-row — same SQL shape, translated to Rust since this runs in the Tauri
/// Rust backend rather than a JS runtime that could import @encatch/core directly.
struct ChatRow {
    id: String,
    title: String,
    created_at: i64,
    updated_at: i64,
    pinned: i64,
    archived_at: Option<i64>,
}

struct MessageRow {
    id: String,
    chat_id: String,
    role: MessageRole,
    content: String,
    created_at: i64,
}

fn now_millis() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64
}

fn to_chat(row: ChatRow) -> Chat {
    Chat {
        id: row.id,
        title: row.title,
        created_at: row.created_at,
        updated_at: row.updated_at,
        pinned: row.pinned != 0,
        archived_at: row.archived_at,
    }
}

fn to_message(row: MessageRow) -> Message {
    Message {
        id: row.id,
        chat_id: row.chat_id,
        role: row.role,
        content: row.content,
        created_at: row.created_at,
    }
}

fn row_to_chat_row(row: &rusqlite::Row) -> rusqlite::Result<ChatRow> {
    Ok(ChatRow {
        id: row.get("id")?,
        title: row.get("title")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        pinned: row.get("pinned")?,
        archived_at: row.get("archived_at")?,
    })
}

fn row_to_message_row(row: &rusqlite::Row) -> rusqlite::Result<MessageRow> {
    let role: String = row.get("role")?;
    Ok(MessageRow {
        id: row.get("id")?,
        chat_id: row.get("chat_id")?,
        role: MessageRole::from_str(&role),
        content: row.get("content")?,
        created_at: row.get("created_at")?,
    })
}

fn get_chat_row(conn: &Connection, chat_id: &str) -> Result<ChatRow, String> {
    conn.query_row("SELECT * FROM chats WHERE id = ?1", [chat_id], row_to_chat_row)
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Chat not found: {chat_id}"))
}

fn get_message_row(conn: &Connection, message_id: &str) -> Result<MessageRow, String> {
    conn.query_row("SELECT * FROM messages WHERE id = ?1", [message_id], row_to_message_row)
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Message not found: {message_id}"))
}

/// Inserts a user message + generated assistant reply, bumping the chat's updated_at.
fn insert_exchange(conn: &Connection, chat: &mut ChatRow, content: &str) -> Result<(Message, Message), String> {
    let now = now_millis();
    conn.execute("UPDATE chats SET updated_at = ?1 WHERE id = ?2", rusqlite::params![now, chat.id])
        .map_err(|e| e.to_string())?;
    chat.updated_at = now;

    let user_row = MessageRow {
        id: Uuid::new_v4().to_string(),
        chat_id: chat.id.clone(),
        role: MessageRole::User,
        content: content.to_string(),
        created_at: now,
    };
    conn.execute(
        "INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![user_row.id, user_row.chat_id, user_row.role.as_str(), user_row.content, user_row.created_at],
    )
    .map_err(|e| e.to_string())?;

    let assistant_row = MessageRow {
        id: Uuid::new_v4().to_string(),
        chat_id: chat.id.clone(),
        role: MessageRole::Assistant,
        content: generate_lorem_reply(&user_row.id),
        created_at: now + 1,
    };
    conn.execute(
        "INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![
            assistant_row.id,
            assistant_row.chat_id,
            assistant_row.role.as_str(),
            assistant_row.content,
            assistant_row.created_at
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok((to_message(user_row), to_message(assistant_row)))
}

pub fn list_chats(conn: &Connection) -> Result<Vec<Chat>, String> {
    let mut stmt = conn
        .prepare("SELECT * FROM chats WHERE archived_at IS NULL ORDER BY pinned DESC, updated_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_chat_row)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(to_chat).collect())
}

pub fn list_archived_chats(conn: &Connection) -> Result<Vec<Chat>, String> {
    let mut stmt = conn
        .prepare("SELECT * FROM chats WHERE archived_at IS NOT NULL ORDER BY archived_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_chat_row)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(to_chat).collect())
}

pub fn delete_chat(conn: &Connection, chat_id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM messages WHERE chat_id = ?1", [chat_id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM chats WHERE id = ?1", [chat_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn set_chat_pinned(conn: &Connection, chat_id: &str, pinned: bool) -> Result<Chat, String> {
    conn.execute(
        "UPDATE chats SET pinned = ?1 WHERE id = ?2",
        rusqlite::params![pinned as i64, chat_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(to_chat(get_chat_row(conn, chat_id)?))
}

pub fn set_chat_archived(conn: &Connection, chat_id: &str, archived: bool) -> Result<Chat, String> {
    let value = if archived { Some(now_millis()) } else { None };
    conn.execute(
        "UPDATE chats SET archived_at = ?1 WHERE id = ?2",
        rusqlite::params![value, chat_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(to_chat(get_chat_row(conn, chat_id)?))
}

pub fn rename_chat(conn: &Connection, chat_id: &str, title: &str) -> Result<Chat, String> {
    let trimmed = title.trim();
    let new_title = if trimmed.is_empty() { "New chat" } else { trimmed };
    conn.execute(
        "UPDATE chats SET title = ?1 WHERE id = ?2",
        rusqlite::params![new_title, chat_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(to_chat(get_chat_row(conn, chat_id)?))
}

pub fn get_messages(conn: &Connection, chat_id: &str) -> Result<Vec<Message>, String> {
    let mut stmt = conn
        .prepare("SELECT * FROM messages WHERE chat_id = ?1 ORDER BY created_at ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([chat_id], row_to_message_row)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(to_message).collect())
}

pub fn send_message(conn: &Connection, chat_id: Option<String>, content: &str) -> Result<SendMessageResult, String> {
    let mut chat_row = match chat_id {
        Some(id) => get_chat_row(conn, &id)?,
        None => {
            let now = now_millis();
            let row = ChatRow {
                id: Uuid::new_v4().to_string(),
                title: derive_chat_title(content),
                created_at: now,
                updated_at: now,
                pinned: 0,
                archived_at: None,
            };
            conn.execute(
                "INSERT INTO chats (id, title, created_at, updated_at, pinned, archived_at) VALUES (?1, ?2, ?3, ?4, 0, NULL)",
                rusqlite::params![row.id, row.title, row.created_at, row.updated_at],
            )
            .map_err(|e| e.to_string())?;
            row
        }
    };

    let (user_message, assistant_message) = insert_exchange(conn, &mut chat_row, content)?;
    Ok(SendMessageResult { chat: to_chat(chat_row), user_message, assistant_message })
}

pub fn regenerate_response(conn: &Connection, message_id: &str) -> Result<Message, String> {
    let row = get_message_row(conn, message_id)?;
    if row.role != MessageRole::Assistant {
        return Err("Can only regenerate assistant messages".to_string());
    }
    let new_content = generate_lorem_reply(&format!("{message_id}:{}", Uuid::new_v4()));
    conn.execute(
        "UPDATE messages SET content = ?1 WHERE id = ?2",
        rusqlite::params![new_content, message_id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE chats SET updated_at = ?1 WHERE id = ?2",
        rusqlite::params![now_millis(), row.chat_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(to_message(MessageRow { content: new_content, ..row }))
}

pub fn edit_message(conn: &Connection, message_id: &str, content: &str) -> Result<SendMessageResult, String> {
    let original = get_message_row(conn, message_id)?;
    if original.role != MessageRole::User {
        return Err("Can only edit user messages".to_string());
    }

    let earlier_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM messages WHERE chat_id = ?1 AND created_at < ?2",
            rusqlite::params![original.chat_id, original.created_at],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM messages WHERE chat_id = ?1 AND created_at >= ?2",
        rusqlite::params![original.chat_id, original.created_at],
    )
    .map_err(|e| e.to_string())?;

    let mut chat_row = get_chat_row(conn, &original.chat_id)?;
    if earlier_count == 0 {
        chat_row.title = derive_chat_title(content);
        conn.execute(
            "UPDATE chats SET title = ?1 WHERE id = ?2",
            rusqlite::params![chat_row.title, chat_row.id],
        )
        .map_err(|e| e.to_string())?;
    }

    let (user_message, assistant_message) = insert_exchange(conn, &mut chat_row, content)?;
    Ok(SendMessageResult { chat: to_chat(chat_row), user_message, assistant_message })
}

pub fn submit_feedback(conn: &Connection, input: FeedbackInput) -> Result<Feedback, String> {
    let feedback = Feedback {
        id: Uuid::new_v4().to_string(),
        scope: input.scope,
        chat_id: input.chat_id,
        message_id: input.message_id,
        rating: input.rating,
        comment: input.comment,
        created_at: now_millis(),
    };
    conn.execute(
        "INSERT INTO feedback (id, scope, chat_id, message_id, rating, comment, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            feedback.id,
            feedback.scope,
            feedback.chat_id,
            feedback.message_id,
            feedback.rating,
            feedback.comment,
            feedback.created_at
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(feedback)
}

pub fn get_nav_user() -> NavUser {
    NavUser { name: "Godwin".to_string(), plan_label: "Encatch Concept Plan".to_string() }
}
