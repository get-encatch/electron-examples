export const IPC_CHANNELS = {
  listChats: "chat-api:list-chats",
  listArchivedChats: "chat-api:list-archived-chats",
  deleteChat: "chat-api:delete-chat",
  setChatPinned: "chat-api:set-chat-pinned",
  setChatArchived: "chat-api:set-chat-archived",
  renameChat: "chat-api:rename-chat",
  getMessages: "chat-api:get-messages",
  sendMessage: "chat-api:send-message",
  regenerateResponse: "chat-api:regenerate-response",
  editMessage: "chat-api:edit-message",
  submitFeedback: "chat-api:submit-feedback",
  getNavUser: "chat-api:get-nav-user"
} as const
