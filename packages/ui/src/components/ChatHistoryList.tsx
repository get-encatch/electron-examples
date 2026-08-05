import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { Archive, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from "lucide-react"
import type { Chat } from "@encatch/core"

interface ChatHistoryListProps {
  chats: Chat[]
  activeChatId: string | null
  searchActive?: boolean
  onSelect: (chatId: string) => void
  onDelete: (chatId: string) => void
  onTogglePin: (chatId: string, pinned: boolean) => void
  onArchive: (chatId: string) => void
  onRename: (chatId: string, title: string) => void
}

function groupLabel(timestamp: number): string {
  const now = new Date()
  const date = new Date(timestamp)
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (diffDays <= 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return "Previous 7 days"
  return "Older"
}

function ChatRowMenu({
  chat,
  open,
  onToggle,
  onRename,
  onTogglePin,
  onArchive,
  onDelete
}: {
  chat: Chat
  open: boolean
  onToggle: () => void
  onRename: () => void
  onTogglePin: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickAway = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) onToggle()
    }
    document.addEventListener("mousedown", onClickAway)
    return () => document.removeEventListener("mousedown", onClickAway)
  }, [open, onToggle])

  return (
    <div className="chat-row-menu" ref={rootRef}>
      <button
        type="button"
        className="chat-history__item-more"
        aria-label={`More actions for chat: ${chat.title}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="chat-row-menu__dropdown" role="menu">
          <button
            type="button"
            role="menuitem"
            className="chat-row-menu__item"
            onClick={(e) => {
              e.stopPropagation()
              onRename()
            }}
          >
            <Pencil size={14} />
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            className="chat-row-menu__item"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin()
            }}
          >
            {chat.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            {chat.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            role="menuitem"
            className="chat-row-menu__item"
            onClick={(e) => {
              e.stopPropagation()
              onArchive()
            }}
          >
            <Archive size={14} />
            Archive
          </button>
          <button
            type="button"
            role="menuitem"
            className="chat-row-menu__item chat-row-menu__item--danger"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export function ChatHistoryList({
  chats,
  activeChatId,
  searchActive = false,
  onSelect,
  onDelete,
  onTogglePin,
  onArchive,
  onRename
}: ChatHistoryListProps) {
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState("")

  if (chats.length === 0) {
    return (
      <div className="chat-history__empty">
        {searchActive ? "No matching chats" : "No conversations yet"}
      </div>
    )
  }

  const startRename = (chat: Chat) => {
    setRenameDraft(chat.title)
    setRenamingChatId(chat.id)
  }

  const commitRename = (chatId: string) => {
    const trimmed = renameDraft.trim()
    if (trimmed) onRename(chatId, trimmed)
    setRenamingChatId(null)
  }

  const onRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>, chatId: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      commitRename(chatId)
    } else if (e.key === "Escape") {
      setRenamingChatId(null)
    }
  }

  const confirmDelete = (chat: Chat) => {
    if (window.confirm(`Delete "${chat.title}"? This can't be undone.`)) onDelete(chat.id)
  }

  let groups: { label: string; chats: Chat[] }[]
  if (searchActive) {
    groups = [{ label: "Search results", chats }]
  } else {
    const pinned = chats.filter((c) => c.pinned)
    const unpinned = chats.filter((c) => !c.pinned)
    groups = []
    for (const chat of unpinned) {
      const label = groupLabel(chat.updatedAt)
      const group = groups.find((g) => g.label === label)
      if (group) {
        group.chats.push(chat)
      } else {
        groups.push({ label, chats: [chat] })
      }
    }
    if (pinned.length > 0) {
      groups.unshift({ label: "Pinned", chats: pinned })
    }
  }

  return (
    <nav className="chat-history" aria-label="Chat history">
      {groups.map((group) => (
        <div key={group.label} className="chat-history__group">
          <div className="chat-history__group-label">{group.label}</div>
          {group.chats.map((chat) => (
            <div
              key={chat.id}
              className={
                "chat-history__item" + (chat.id === activeChatId ? " chat-history__item--active" : "")
              }
            >
              {renamingChatId === chat.id ? (
                <input
                  type="text"
                  className="chat-history__item-rename-input"
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onKeyDown={(e) => onRenameKeyDown(e, chat.id)}
                  onBlur={() => commitRename(chat.id)}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  className="chat-history__item-title"
                  onClick={() => onSelect(chat.id)}
                >
                  {chat.title}
                </button>
              )}
              <ChatRowMenu
                chat={chat}
                open={openMenuChatId === chat.id}
                onToggle={() => setOpenMenuChatId((current) => (current === chat.id ? null : chat.id))}
                onRename={() => {
                  setOpenMenuChatId(null)
                  startRename(chat)
                }}
                onTogglePin={() => {
                  setOpenMenuChatId(null)
                  onTogglePin(chat.id, !chat.pinned)
                }}
                onArchive={() => {
                  setOpenMenuChatId(null)
                  onArchive(chat.id)
                }}
                onDelete={() => {
                  setOpenMenuChatId(null)
                  confirmDelete(chat)
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </nav>
  )
}
