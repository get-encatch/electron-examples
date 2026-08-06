import { invoke } from "@tauri-apps/api/core"
import type { ChatApi, FeedbackInput } from "@encatch/core"

/**
 * Implements the shared ChatApi contract over Tauri's invoke() bridge.
 * This is the Tauri analogue of apps/electron-chat-app/src/preload/index.ts and
 * apps/bun-chat-app/src/client/httpChatApi.ts — same contract, different transport.
 */
export const tauriChatApi: ChatApi = {
  listChats: () => invoke("list_chats"),
  listArchivedChats: () => invoke("list_archived_chats"),
  deleteChat: (chatId) => invoke("delete_chat", { chatId }),
  setChatPinned: (chatId, pinned) => invoke("set_chat_pinned", { chatId, pinned }),
  setChatArchived: (chatId, archived) => invoke("set_chat_archived", { chatId, archived }),
  renameChat: (chatId, title) => invoke("rename_chat", { chatId, title }),
  getMessages: (chatId) => invoke("get_messages", { chatId }),
  sendMessage: (chatId, content) => invoke("send_message", { chatId, content }),
  regenerateResponse: (messageId) => invoke("regenerate_response", { messageId }),
  editMessage: (messageId, content) => invoke("edit_message", { messageId, content }),
  submitFeedback: (input: FeedbackInput) => invoke("submit_feedback", { input }),
  getNavUser: () => invoke("get_nav_user")
}
