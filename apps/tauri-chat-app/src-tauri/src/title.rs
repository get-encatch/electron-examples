const MAX_TITLE_LENGTH: usize = 48;

/// Derives a chat's subject/title from the first user message, Claude-style.
/// Port of packages/core/src/title.ts.
pub fn derive_chat_title(first_message: &str) -> String {
    let first_line = first_message.trim().lines().next().unwrap_or("").trim();
    if first_line.chars().count() <= MAX_TITLE_LENGTH {
        return if first_line.is_empty() {
            "New chat".to_string()
        } else {
            first_line.to_string()
        };
    }
    let truncated: String = first_line.chars().take(MAX_TITLE_LENGTH - 1).collect();
    truncated.trim_end().to_string() + "…"
}
