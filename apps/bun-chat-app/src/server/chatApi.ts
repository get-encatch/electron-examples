import { randomUUID } from "node:crypto"
import type { Database } from "bun:sqlite"
import {
  deriveChatTitle,
  generateLoremReply,
  type Chat,
  type ChatApi,
  type Feedback,
  type FeedbackInput,
  type Message,
  type NavUser,
  type SendMessageResult
} from "@encatch/core"

interface ChatRow {
  id: string
  title: string
  created_at: number
  updated_at: number
  pinned: number
  archived_at: number | null
}

interface MessageRow {
  id: string
  chat_id: string
  role: "user" | "assistant"
  content: string
  created_at: number
}

function toChat(row: ChatRow): Chat {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pinned: row.pinned === 1,
    archivedAt: row.archived_at
  }
}

function toMessage(row: MessageRow): Message {
  return { id: row.id, chatId: row.chat_id, role: row.role, content: row.content, createdAt: row.created_at }
}

const NAV_USER: NavUser = { name: "Godwin", planLabel: "Encatch Concept Plan" }

/**
 * Implements the shared ChatApi contract over bun:sqlite. Runs inside the Bun server process
 * — same contract and SQL shape as apps/chat-app/src/main/chatApi.ts, just a different SQLite driver.
 */
export function createChatApi(db: Database): ChatApi {
  const getChatRow = (chatId: string): ChatRow => {
    const row = db.query("SELECT * FROM chats WHERE id = ?").get(chatId) as ChatRow | null
    if (!row) throw new Error(`Chat not found: ${chatId}`)
    return row
  }

  const getMessageRow = (messageId: string): MessageRow => {
    const row = db.query("SELECT * FROM messages WHERE id = ?").get(messageId) as MessageRow | null
    if (!row) throw new Error(`Message not found: ${messageId}`)
    return row
  }

  /** Inserts a user message + generated assistant reply, bumping the chat's updated_at. */
  const insertExchange = (
    chatRow: ChatRow,
    content: string
  ): { userMessage: Message; assistantMessage: Message } => {
    const now = Date.now()
    db.query("UPDATE chats SET updated_at = ? WHERE id = ?").run(now, chatRow.id)
    chatRow.updated_at = now

    const userMessageRow: MessageRow = {
      id: randomUUID(),
      chat_id: chatRow.id,
      role: "user",
      content,
      created_at: now
    }
    db.query("INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)").run(
      userMessageRow.id,
      userMessageRow.chat_id,
      userMessageRow.role,
      userMessageRow.content,
      userMessageRow.created_at
    )

    const assistantMessageRow: MessageRow = {
      id: randomUUID(),
      chat_id: chatRow.id,
      role: "assistant",
      content: generateLoremReply(userMessageRow.id),
      created_at: now + 1
    }
    db.query("INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)").run(
      assistantMessageRow.id,
      assistantMessageRow.chat_id,
      assistantMessageRow.role,
      assistantMessageRow.content,
      assistantMessageRow.created_at
    )

    return { userMessage: toMessage(userMessageRow), assistantMessage: toMessage(assistantMessageRow) }
  }

  return {
    async listChats() {
      const rows = db
        .query("SELECT * FROM chats WHERE archived_at IS NULL ORDER BY pinned DESC, updated_at DESC")
        .all() as ChatRow[]
      return rows.map(toChat)
    },

    async listArchivedChats() {
      const rows = db
        .query("SELECT * FROM chats WHERE archived_at IS NOT NULL ORDER BY archived_at DESC")
        .all() as ChatRow[]
      return rows.map(toChat)
    },

    async deleteChat(chatId) {
      db.query("DELETE FROM messages WHERE chat_id = ?").run(chatId)
      db.query("DELETE FROM chats WHERE id = ?").run(chatId)
    },

    async setChatPinned(chatId, pinned) {
      db.query("UPDATE chats SET pinned = ? WHERE id = ?").run(pinned ? 1 : 0, chatId)
      return toChat(getChatRow(chatId))
    },

    async setChatArchived(chatId, archived) {
      db.query("UPDATE chats SET archived_at = ? WHERE id = ?").run(archived ? Date.now() : null, chatId)
      return toChat(getChatRow(chatId))
    },

    async renameChat(chatId, title) {
      const trimmed = title.trim()
      db.query("UPDATE chats SET title = ? WHERE id = ?").run(trimmed.length > 0 ? trimmed : "New chat", chatId)
      return toChat(getChatRow(chatId))
    },

    async getMessages(chatId) {
      const rows = db
        .query("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC")
        .all(chatId) as MessageRow[]
      return rows.map(toMessage)
    },

    async sendMessage(chatId, content): Promise<SendMessageResult> {
      const chatRow = chatId
        ? getChatRow(chatId)
        : (() => {
            const now = Date.now()
            const row: ChatRow = {
              id: randomUUID(),
              title: deriveChatTitle(content),
              created_at: now,
              updated_at: now,
              pinned: 0,
              archived_at: null
            }
            db.query(
              "INSERT INTO chats (id, title, created_at, updated_at, pinned, archived_at) VALUES (?, ?, ?, ?, 0, NULL)"
            ).run(row.id, row.title, row.created_at, row.updated_at)
            return row
          })()

      const { userMessage, assistantMessage } = insertExchange(chatRow, content)
      return { chat: toChat(chatRow), userMessage, assistantMessage }
    },

    async regenerateResponse(messageId) {
      const row = getMessageRow(messageId)
      if (row.role !== "assistant") throw new Error("Can only regenerate assistant messages")
      const newContent = generateLoremReply(`${messageId}:${randomUUID()}`)
      db.query("UPDATE messages SET content = ? WHERE id = ?").run(newContent, messageId)
      db.query("UPDATE chats SET updated_at = ? WHERE id = ?").run(Date.now(), row.chat_id)
      return toMessage({ ...row, content: newContent })
    },

    async editMessage(messageId, content): Promise<SendMessageResult> {
      const original = getMessageRow(messageId)
      if (original.role !== "user") throw new Error("Can only edit user messages")

      const earlierCount = (
        db
          .query("SELECT COUNT(*) as n FROM messages WHERE chat_id = ? AND created_at < ?")
          .get(original.chat_id, original.created_at) as { n: number }
      ).n

      db.query("DELETE FROM messages WHERE chat_id = ? AND created_at >= ?").run(
        original.chat_id,
        original.created_at
      )

      const chatRow = getChatRow(original.chat_id)
      if (earlierCount === 0) {
        chatRow.title = deriveChatTitle(content)
        db.query("UPDATE chats SET title = ? WHERE id = ?").run(chatRow.title, chatRow.id)
      }

      const { userMessage, assistantMessage } = insertExchange(chatRow, content)
      return { chat: toChat(chatRow), userMessage, assistantMessage }
    },

    async submitFeedback(input: FeedbackInput): Promise<Feedback> {
      const feedback: Feedback = {
        id: randomUUID(),
        createdAt: Date.now(),
        ...input
      }
      db.query(
        "INSERT INTO feedback (id, scope, chat_id, message_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(
        feedback.id,
        feedback.scope,
        feedback.chatId ?? null,
        feedback.messageId ?? null,
        feedback.rating ?? null,
        feedback.comment ?? null,
        feedback.createdAt
      )
      return feedback
    },

    async getNavUser() {
      return NAV_USER
    }
  }
}
