import { useMemo, useState } from "react"
import { Plus, Search, Sparkles } from "lucide-react"
import type { Chat, NavUser } from "@encatch/core"
import { ChatHistoryList } from "./ChatHistoryList"
import { UserNav } from "./UserNav"

interface SidebarProps {
  chats: Chat[]
  activeChatId: string | null
  navUser: NavUser
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onTogglePinChat: (chatId: string, pinned: boolean) => void
  onArchiveChat: (chatId: string) => void
  onRenameChat: (chatId: string, title: string) => void
  onOpenSettings: () => void
  onGiveAppFeedback: () => void
}

export function Sidebar({
  chats,
  activeChatId,
  navUser,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onTogglePinChat,
  onArchiveChat,
  onRenameChat,
  onOpenSettings,
  onGiveAppFeedback
}: SidebarProps) {
  const [query, setQuery] = useState("")

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return chats
    return chats.filter((c) => c.title.toLowerCase().includes(q))
  }, [chats, query])

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <Sparkles className="sidebar__brand-mark" size={16} aria-hidden />
        <span className="sidebar__brand">Encatch</span>
      </div>

      <button type="button" className="sidebar__new-chat" onClick={onNewChat}>
        <Plus className="sidebar__new-chat-icon" size={16} aria-hidden />
        New chat
      </button>

      {chats.length > 0 && (
        <div className="sidebar__search">
          <Search className="sidebar__search-icon" size={14} aria-hidden />
          <input
            type="text"
            className="sidebar__search-input"
            placeholder="Search chats…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search chats"
          />
        </div>
      )}

      <div className="sidebar__history">
        <ChatHistoryList
          chats={filteredChats}
          activeChatId={activeChatId}
          onSelect={onSelectChat}
          onDelete={onDeleteChat}
          onTogglePin={onTogglePinChat}
          onArchive={onArchiveChat}
          onRename={onRenameChat}
          searchActive={query.trim().length > 0}
        />
      </div>

      <div className="sidebar__footer">
        <button type="button" className="sidebar__settings-link" onClick={onOpenSettings}>
          Settings
        </button>
        <UserNav user={navUser} onOpenSettings={onOpenSettings} onGiveAppFeedback={onGiveAppFeedback} />
      </div>
    </aside>
  )
}
