import { contextBridge, ipcRenderer } from "electron"
import { electronAPI } from "@electron-toolkit/preload"
import type { ChatApi, FeedbackInput } from "@encatch/core"
import { IPC_CHANNELS } from "../shared/ipcChannels"

const chatApi: ChatApi = {
  listChats: () => ipcRenderer.invoke(IPC_CHANNELS.listChats),
  listArchivedChats: () => ipcRenderer.invoke(IPC_CHANNELS.listArchivedChats),
  deleteChat: (chatId) => ipcRenderer.invoke(IPC_CHANNELS.deleteChat, chatId),
  setChatPinned: (chatId, pinned) => ipcRenderer.invoke(IPC_CHANNELS.setChatPinned, chatId, pinned),
  setChatArchived: (chatId, archived) =>
    ipcRenderer.invoke(IPC_CHANNELS.setChatArchived, chatId, archived),
  renameChat: (chatId, title) => ipcRenderer.invoke(IPC_CHANNELS.renameChat, chatId, title),
  getMessages: (chatId) => ipcRenderer.invoke(IPC_CHANNELS.getMessages, chatId),
  sendMessage: (chatId, content) => ipcRenderer.invoke(IPC_CHANNELS.sendMessage, chatId, content),
  regenerateResponse: (messageId) => ipcRenderer.invoke(IPC_CHANNELS.regenerateResponse, messageId),
  editMessage: (messageId, content) => ipcRenderer.invoke(IPC_CHANNELS.editMessage, messageId, content),
  submitFeedback: (input: FeedbackInput) => ipcRenderer.invoke(IPC_CHANNELS.submitFeedback, input),
  getNavUser: () => ipcRenderer.invoke(IPC_CHANNELS.getNavUser)
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld("electron", electronAPI)
  contextBridge.exposeInMainWorld("chatApi", chatApi)
} else {
  // @ts-expect-error non-isolated fallback, dev-only
  window.electron = electronAPI
  // @ts-expect-error non-isolated fallback, dev-only
  window.chatApi = chatApi
}
