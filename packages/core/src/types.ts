export interface Chat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  pinned: boolean
  archivedAt: number | null
}

export type MessageRole = "user" | "assistant"

export interface Message {
  id: string
  chatId: string
  role: MessageRole
  content: string
  createdAt: number
}

export type FeedbackScope = "response" | "conversation" | "app"
export type FeedbackRating = "up" | "down"

export interface FeedbackInput {
  scope: FeedbackScope
  chatId?: string
  messageId?: string
  rating?: FeedbackRating
  comment?: string
}

export interface Feedback extends FeedbackInput {
  id: string
  createdAt: number
}

export interface SendMessageResult {
  chat: Chat
  userMessage: Message
  assistantMessage: Message
}

export interface NavUser {
  name: string
  planLabel: string
}

/**
 * Shell-agnostic data contract. Electron implements this over IPC + better-sqlite3;
 * a future Tauri shell can implement the same interface over Tauri commands + rusqlite,
 * and a Bun shell over bun:sqlite — the renderer UI in @encatch/ui never needs to change.
 */
export interface ChatApi {
  /** Non-archived chats, pinned first then most-recently-updated. */
  listChats(): Promise<Chat[]>
  listArchivedChats(): Promise<Chat[]>
  deleteChat(chatId: string): Promise<void>
  setChatPinned(chatId: string, pinned: boolean): Promise<Chat>
  setChatArchived(chatId: string, archived: boolean): Promise<Chat>
  renameChat(chatId: string, title: string): Promise<Chat>
  getMessages(chatId: string): Promise<Message[]>
  /** Pass `chatId: null` to start a new chat — the chat is created and titled from this first message. */
  sendMessage(chatId: string | null, content: string): Promise<SendMessageResult>
  /** Regenerates the assistant reply for `messageId` in place, with new placeholder content. */
  regenerateResponse(messageId: string): Promise<Message>
  /** Edits a user message, discarding it and everything after it, then re-sends with the new content. */
  editMessage(messageId: string, content: string): Promise<SendMessageResult>
  submitFeedback(input: FeedbackInput): Promise<Feedback>
  getNavUser(): Promise<NavUser>
}
