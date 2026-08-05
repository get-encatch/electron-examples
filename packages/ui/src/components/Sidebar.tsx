import { useMemo, useState } from "react"
import { PanelLeftClose, Plus, Search, Sparkles } from "lucide-react"
import type { Chat, NavUser } from "@encatch/core"
import { ChatHistoryList } from "./ChatHistoryList"
import { UserNav } from "./UserNav"

interface SidebarProps {
  chats: Chat[]
  activeChatId: string | null
  navUser: NavUser
  collapsed: boolean
  /** Narrow window: render as a slide-over sheet with a backdrop instead of an inline column. */
  sheet: boolean
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onTogglePinChat: (chatId: string, pinned: boolean) => void
  onArchiveChat: (chatId: string) => void
  onRenameChat: (chatId: string, title: string) => void
  onOpenSettings: () => void
  onGiveAppFeedback: () => void
  onToggleCollapse: () => void
}

export function Sidebar({
  chats,
  activeChatId,
  navUser,
  collapsed,
  sheet,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onTogglePinChat,
  onArchiveChat,
  onRenameChat,
  onOpenSettings,
  onGiveAppFeedback,
  onToggleCollapse
}: SidebarProps) {
  const [query, setQuery] = useState("")

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return chats
    return chats.filter((c) => c.title.toLowerCase().includes(q))
  }, [chats, query])

  // As a sheet, picking a chat (or starting a new one) should close the drawer like a mobile UI.
  const closeIfSheet = () => {
    if (sheet) onToggleCollapse()
  }

  const className =
    "sidebar" + (sheet ? " sidebar--sheet" : "") + (collapsed ? " sidebar--collapsed" : "")

  return (
    <aside className={className} aria-hidden={collapsed}>
      <div className="sidebar__header">
        <Sparkles className="sidebar__brand-mark" size={16} aria-hidden />
        <span className="sidebar__brand">Encatch</span>
        <button
          type="button"
          className="sidebar__collapse-btn"
          onClick={onToggleCollapse}
          aria-label="Collapse sidebar"
          tabIndex={collapsed ? -1 : 0}
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <button
        type="button"
        className="sidebar__new-chat"
        onClick={() => {
          onNewChat()
          closeIfSheet()
        }}
      >
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
          onSelect={(chatId) => {
            onSelectChat(chatId)
            closeIfSheet()
          }}
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
