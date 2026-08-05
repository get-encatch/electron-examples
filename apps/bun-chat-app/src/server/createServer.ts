import type { BunRequest, Server } from "bun"
import type { FeedbackInput } from "@encatch/core"
import { openDatabase } from "./db"
import { createChatApi } from "./chatApi"
import homepage from "../client/index.html"

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init)
}

/** Wraps a ChatApi call so thrown errors (e.g. "Chat not found") become 400s instead of 500s. */
async function handle(fn: () => Promise<unknown>): Promise<Response> {
  try {
    return json(await fn())
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : "Unknown error" }, { status: 400 })
  }
}

/**
 * Starts the Bun.serve backend shared by both the browser shell (src/server/index.ts) and
 * the desktop shell (src/desktop/*) — same REST API and static homepage either way.
 */
export function startServer(port: number): Server<undefined> {
  const db = openDatabase()
  const chatApi = createChatApi(db)

  return Bun.serve({
    routes: {
      "/": homepage,

      "/api/nav-user": {
        GET: () => handle(() => chatApi.getNavUser())
      },

      "/api/chats": {
        GET: () => handle(() => chatApi.listChats())
      },

      "/api/chats/archived": {
        GET: () => handle(() => chatApi.listArchivedChats())
      },

      "/api/chats/:id": {
        DELETE: (req: BunRequest<"/api/chats/:id">) => handle(() => chatApi.deleteChat(req.params.id))
      },

      "/api/chats/:id/pin": {
        PATCH: async (req: BunRequest<"/api/chats/:id/pin">) => {
          const { pinned } = (await req.json()) as { pinned: boolean }
          return handle(() => chatApi.setChatPinned(req.params.id, pinned))
        }
      },

      "/api/chats/:id/archive": {
        PATCH: async (req: BunRequest<"/api/chats/:id/archive">) => {
          const { archived } = (await req.json()) as { archived: boolean }
          return handle(() => chatApi.setChatArchived(req.params.id, archived))
        }
      },

      "/api/chats/:id/rename": {
        PATCH: async (req: BunRequest<"/api/chats/:id/rename">) => {
          const { title } = (await req.json()) as { title: string }
          return handle(() => chatApi.renameChat(req.params.id, title))
        }
      },

      "/api/chats/:id/messages": {
        GET: (req: BunRequest<"/api/chats/:id/messages">) => handle(() => chatApi.getMessages(req.params.id))
      },

      "/api/messages": {
        POST: async (req) => {
          const { chatId, content } = (await req.json()) as { chatId: string | null; content: string }
          return handle(() => chatApi.sendMessage(chatId, content))
        }
      },

      "/api/messages/:id": {
        PATCH: async (req: BunRequest<"/api/messages/:id">) => {
          const { content } = (await req.json()) as { content: string }
          return handle(() => chatApi.editMessage(req.params.id, content))
        }
      },

      "/api/messages/:id/regenerate": {
        POST: (req: BunRequest<"/api/messages/:id/regenerate">) =>
          handle(() => chatApi.regenerateResponse(req.params.id))
      },

      "/api/feedback": {
        POST: async (req) => {
          const input = (await req.json()) as FeedbackInput
          return handle(() => chatApi.submitFeedback(input))
        }
      }
    },
    development: process.env.NODE_ENV !== "production",
    port
  })
}
