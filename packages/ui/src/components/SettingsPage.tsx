import { useEffect, useState } from "react"
import { ArchiveRestore, ArrowLeft, PanelLeftOpen, Trash2 } from "lucide-react"
import type { Chat, NavUser } from "@encatch/core"
import { useChatApi } from "../context/ApiContext"
import { useTheme, type ThemePreference } from "../context/ThemeContext"

interface SettingsPageProps {
  navUser: NavUser
  onBack: () => void
  onChatUnarchived: (chatId: string) => void
  sidebarCollapsed: boolean
  onExpandSidebar: () => void
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" }
]

export function SettingsPage({
  navUser,
  onBack,
  onChatUnarchived,
  sidebarCollapsed,
  onExpandSidebar
}: SettingsPageProps) {
  const api = useChatApi()
  const { theme, setTheme } = useTheme()
  const [archivedChats, setArchivedChats] = useState<Chat[]>([])

  useEffect(() => {
    api.listArchivedChats().then(setArchivedChats)
  }, [api])

  const unarchive = (chatId: string) => {
    api.setChatArchived(chatId, false).then(() => {
      setArchivedChats((prev) => prev.filter((c) => c.id !== chatId))
      onChatUnarchived(chatId)
    })
  }

  const remove = (chatId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return
    api.deleteChat(chatId).then(() => {
      setArchivedChats((prev) => prev.filter((c) => c.id !== chatId))
    })
  }

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <div className="settings-page__header-row">
          {sidebarCollapsed && (
            <button
              type="button"
              className="sidebar-toggle"
              onClick={onExpandSidebar}
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
          <button type="button" className="settings-page__back" onClick={onBack}>
            <ArrowLeft size={14} /> Back to chat
          </button>
        </div>
        <h1>Settings</h1>
      </div>

      <section className="settings-page__section">
        <h2>Account</h2>
        <div className="settings-page__row">
          <span>Name</span>
          <span>{navUser.name}</span>
        </div>
        <div className="settings-page__row">
          <span>Plan</span>
          <span>{navUser.planLabel}</span>
        </div>
      </section>

      <section className="settings-page__section">
        <h2>Appearance</h2>
        <div className="settings-page__row">
          <span>Theme</span>
          <div className="theme-picker" role="radiogroup" aria-label="Theme">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={theme === option.value}
                className={
                  "theme-picker__btn" + (theme === option.value ? " theme-picker__btn--active" : "")
                }
                onClick={() => setTheme(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-page__section">
        <h2>Archived chats</h2>
        {archivedChats.length === 0 ? (
          <p className="settings-page__empty">No archived chats.</p>
        ) : (
          <ul className="archived-list">
            {archivedChats.map((chat) => (
              <li key={chat.id} className="archived-list__item">
                <span className="archived-list__title">{chat.title}</span>
                <div className="archived-list__actions">
                  <button
                    type="button"
                    className="archived-list__btn"
                    onClick={() => unarchive(chat.id)}
                    title="Unarchive"
                    aria-label={`Unarchive chat: ${chat.title}`}
                  >
                    <ArchiveRestore size={14} />
                  </button>
                  <button
                    type="button"
                    className="archived-list__btn archived-list__btn--danger"
                    onClick={() => remove(chat.id, chat.title)}
                    title="Delete"
                    aria-label={`Delete chat: ${chat.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="settings-page__section">
        <h2>About this app</h2>
        <p>
          This is a concept UI for exploring the <strong>encatch</strong> feedback SDK. All chat
          data is mock and stored locally in a SQLite database; assistant replies are placeholder
          Lorem Ipsum text, not real AI output.
        </p>
      </section>
    </div>
  )
}
