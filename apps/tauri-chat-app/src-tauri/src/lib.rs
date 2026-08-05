mod chat_api;
mod db;
mod lorem;
mod models;
mod title;

use std::sync::Mutex;

use models::{Chat, Feedback, FeedbackInput, Message, NavUser, SendMessageResult};
use rusqlite::Connection;
use tauri::{Manager, State};

struct AppState {
    db: Mutex<Connection>,
}

#[tauri::command]
fn list_chats(state: State<AppState>) -> Result<Vec<Chat>, String> {
    chat_api::list_chats(&state.db.lock().unwrap())
}

#[tauri::command]
fn list_archived_chats(state: State<AppState>) -> Result<Vec<Chat>, String> {
    chat_api::list_archived_chats(&state.db.lock().unwrap())
}

#[tauri::command]
fn delete_chat(state: State<AppState>, chat_id: String) -> Result<(), String> {
    chat_api::delete_chat(&state.db.lock().unwrap(), &chat_id)
}

#[tauri::command]
fn set_chat_pinned(state: State<AppState>, chat_id: String, pinned: bool) -> Result<Chat, String> {
    chat_api::set_chat_pinned(&state.db.lock().unwrap(), &chat_id, pinned)
}

#[tauri::command]
fn set_chat_archived(state: State<AppState>, chat_id: String, archived: bool) -> Result<Chat, String> {
    chat_api::set_chat_archived(&state.db.lock().unwrap(), &chat_id, archived)
}

#[tauri::command]
fn rename_chat(state: State<AppState>, chat_id: String, title: String) -> Result<Chat, String> {
    chat_api::rename_chat(&state.db.lock().unwrap(), &chat_id, &title)
}

#[tauri::command]
fn get_messages(state: State<AppState>, chat_id: String) -> Result<Vec<Message>, String> {
    chat_api::get_messages(&state.db.lock().unwrap(), &chat_id)
}

#[tauri::command]
fn send_message(state: State<AppState>, chat_id: Option<String>, content: String) -> Result<SendMessageResult, String> {
    chat_api::send_message(&state.db.lock().unwrap(), chat_id, &content)
}

#[tauri::command]
fn regenerate_response(state: State<AppState>, message_id: String) -> Result<Message, String> {
    chat_api::regenerate_response(&state.db.lock().unwrap(), &message_id)
}

#[tauri::command]
fn edit_message(state: State<AppState>, message_id: String, content: String) -> Result<SendMessageResult, String> {
    chat_api::edit_message(&state.db.lock().unwrap(), &message_id, &content)
}

#[tauri::command]
fn submit_feedback(state: State<AppState>, input: FeedbackInput) -> Result<Feedback, String> {
    chat_api::submit_feedback(&state.db.lock().unwrap(), input)
}

#[tauri::command]
fn get_nav_user() -> NavUser {
    chat_api::get_nav_user()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let data_dir = app.path().app_data_dir().expect("no app data directory available");
            let conn = db::open_database(&data_dir);
            app.manage(AppState { db: Mutex::new(conn) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_chats,
            list_archived_chats,
            delete_chat,
            set_chat_pinned,
            set_chat_archived,
            rename_chat,
            get_messages,
            send_message,
            regenerate_response,
            edit_message,
            submit_feedback,
            get_nav_user
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
