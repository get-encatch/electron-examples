import { ipcMain } from "electron"
import type { ChatApi } from "@encatch/core"
import { IPC_CHANNELS } from "../shared/ipcChannels"

export function registerChatApiIpc(api: ChatApi): void {
  ipcMain.handle(IPC_CHANNELS.listChats, () => api.listChats())
  ipcMain.handle(IPC_CHANNELS.listArchivedChats, () => api.listArchivedChats())
  ipcMain.handle(IPC_CHANNELS.deleteChat, (_event, chatId: string) => api.deleteChat(chatId))
  ipcMain.handle(IPC_CHANNELS.setChatPinned, (_event, chatId: string, pinned: boolean) =>
    api.setChatPinned(chatId, pinned)
  )
  ipcMain.handle(IPC_CHANNELS.setChatArchived, (_event, chatId: string, archived: boolean) =>
    api.setChatArchived(chatId, archived)
  )
  ipcMain.handle(IPC_CHANNELS.renameChat, (_event, chatId: string, title: string) =>
    api.renameChat(chatId, title)
  )
  ipcMain.handle(IPC_CHANNELS.getMessages, (_event, chatId: string) => api.getMessages(chatId))
  ipcMain.handle(IPC_CHANNELS.sendMessage, (_event, chatId: string | null, content: string) =>
    api.sendMessage(chatId, content)
  )
  ipcMain.handle(IPC_CHANNELS.regenerateResponse, (_event, messageId: string) =>
    api.regenerateResponse(messageId)
  )
  ipcMain.handle(IPC_CHANNELS.editMessage, (_event, messageId: string, content: string) =>
    api.editMessage(messageId, content)
  )
  ipcMain.handle(IPC_CHANNELS.submitFeedback, (_event, input: Parameters<ChatApi["submitFeedback"]>[0]) =>
    api.submitFeedback(input)
  )
  ipcMain.handle(IPC_CHANNELS.getNavUser, () => api.getNavUser())
}
