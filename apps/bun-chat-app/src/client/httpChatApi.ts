import type { ChatApi, FeedbackInput } from "@encatch/core"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message ?? `Request failed: ${path}`)
  return data as T
}

/**
 * Implements the shared ChatApi contract over fetch against the Bun server's REST routes.
 * This is the browser-shell analogue of apps/electron-chat-app/src/preload/index.ts.
 */
export const httpChatApi: ChatApi = {
  listChats: () => request("/chats"),
  listArchivedChats: () => request("/chats/archived"),
  deleteChat: (chatId) => request(`/chats/${chatId}`, { method: "DELETE" }),
  setChatPinned: (chatId, pinned) =>
    request(`/chats/${chatId}/pin`, { method: "PATCH", body: JSON.stringify({ pinned }) }),
  setChatArchived: (chatId, archived) =>
    request(`/chats/${chatId}/archive`, { method: "PATCH", body: JSON.stringify({ archived }) }),
  renameChat: (chatId, title) =>
    request(`/chats/${chatId}/rename`, { method: "PATCH", body: JSON.stringify({ title }) }),
  getMessages: (chatId) => request(`/chats/${chatId}/messages`),
  sendMessage: (chatId, content) =>
    request("/messages", { method: "POST", body: JSON.stringify({ chatId, content }) }),
  regenerateResponse: (messageId) => request(`/messages/${messageId}/regenerate`, { method: "POST" }),
  editMessage: (messageId, content) =>
    request(`/messages/${messageId}`, { method: "PATCH", body: JSON.stringify({ content }) }),
  submitFeedback: (input: FeedbackInput) =>
    request("/feedback", { method: "POST", body: JSON.stringify(input) }),
  getNavUser: () => request("/nav-user")
}
