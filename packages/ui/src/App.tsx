import { useCallback, useEffect, useRef, useState } from "react"
import { PanelLeftOpen } from "lucide-react"
import type { Chat, FeedbackRating, Message, NavUser } from "@encatch/core"
import { useChatApi } from "./context/ApiContext"
import { ThemeProvider } from "./context/ThemeContext"
import { Sidebar } from "./components/Sidebar"
import { ChatView } from "./components/ChatView"
import { SettingsPage } from "./components/SettingsPage"
import { FeedbackModal, type FeedbackModalState } from "./components/FeedbackModal"

type View = "chat" | "settings"

export function App() {
  const api = useChatApi()

  const [chats, setChats] = useState<Chat[]>([])
  const [navUser, setNavUser] = useState<NavUser | null>(null)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [view, setView] = useState<View>("chat")
  const [isThinking, setIsThinking] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState | null>(null)
  const isNarrowViewport = () => typeof window !== "undefined" && window.innerWidth < 760
  const [isNarrow, setIsNarrow] = useState(isNarrowViewport)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isNarrowViewport)

  /** Bumped on every send/edit and on stop, so a late-resolving request can detect it was superseded. */
  const requestIdRef = useRef(0)

  useEffect(() => {
    api.listChats().then(setChats)
    api.getNavUser().then(setNavUser)
  }, [api])

  // Below the breakpoint the sidebar becomes a slide-over sheet (starts closed) instead of
  // an inline column; crossing back above it restores the normal inline layout (always shown).
  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)")
    const handleChange = (event: MediaQueryListEvent) => {
      setIsNarrow(event.matches)
      setSidebarCollapsed(event.matches)
    }
    query.addEventListener("change", handleChange)
    return () => query.removeEventListener("change", handleChange)
  }, [])

  const toggleSidebar = useCallback(() => setSidebarCollapsed((collapsed) => !collapsed), [])

  const selectChat = useCallback(
    (chatId: string) => {
      setActiveChatId(chatId)
      setView("chat")
      setStreamingMessageId(null)
      api.getMessages(chatId).then(setMessages)
    },
    [api]
  )

  const startNewChat = useCallback(() => {
    setActiveChatId(null)
    setMessages([])
    setStreamingMessageId(null)
    setView("chat")
  }, [])

  const deleteChat = useCallback(
    (chatId: string) => {
      api.deleteChat(chatId).then(() => {
        setChats((prev) => prev.filter((c) => c.id !== chatId))
        if (activeChatId === chatId) {
          setActiveChatId(null)
          setMessages([])
        }
      })
    },
    [api, activeChatId]
  )

  const togglePinChat = useCallback(
    (chatId: string, pinned: boolean) => {
      api.setChatPinned(chatId, pinned).then(() => api.listChats().then(setChats))
    },
    [api]
  )

  const renameChat = useCallback(
    (chatId: string, title: string) => {
      api.renameChat(chatId, title).then((updated) => {
        setChats((prev) => prev.map((c) => (c.id === chatId ? updated : c)))
      })
    },
    [api]
  )

  const unarchiveChat = useCallback(() => {
    api.listChats().then(setChats)
  }, [api])

  const archiveChat = useCallback(
    (chatId: string) => {
      api.setChatArchived(chatId, true).then(() => {
        setChats((prev) => prev.filter((c) => c.id !== chatId))
        if (activeChatId === chatId) {
          setActiveChatId(null)
          setMessages([])
        }
      })
    },
    [api, activeChatId]
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const requestId = ++requestIdRef.current
      const optimisticUser: Message = {
        id: `pending-${Date.now()}`,
        chatId: activeChatId ?? "pending",
        role: "user",
        content: text,
        createdAt: Date.now()
      }
      setMessages((prev) => [...prev, optimisticUser])
      setIsThinking(true)

      const result = await api.sendMessage(activeChatId, text)
      if (requestIdRef.current !== requestId) return // stopped/superseded before this resolved

      setIsThinking(false)
      setActiveChatId(result.chat.id)
      setStreamingMessageId(result.assistantMessage.id)
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        result.userMessage,
        result.assistantMessage
      ])
      setChats((prev) => {
        const withoutThisChat = prev.filter((c) => c.id !== result.chat.id)
        return [result.chat, ...withoutThisChat]
      })
    },
    [api, activeChatId]
  )

  const editMessage = useCallback(
    async (messageId: string, text: string) => {
      const requestId = ++requestIdRef.current
      setIsThinking(true)

      const result = await api.editMessage(messageId, text)
      if (requestIdRef.current !== requestId) return

      setIsThinking(false)
      setStreamingMessageId(result.assistantMessage.id)
      setMessages((prev) => {
        const cutIndex = prev.findIndex((m) => m.id === messageId)
        const kept = cutIndex === -1 ? prev : prev.slice(0, cutIndex)
        return [...kept, result.userMessage, result.assistantMessage]
      })
      setChats((prev) => {
        const withoutThisChat = prev.filter((c) => c.id !== result.chat.id)
        return [result.chat, ...withoutThisChat]
      })
    },
    [api]
  )

  const regenerateMessage = useCallback(
    async (messageId: string) => {
      const updated = await api.regenerateResponse(messageId)
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)))
      setStreamingMessageId(messageId)
    },
    [api]
  )

  const stopGenerating = useCallback(() => {
    requestIdRef.current++ // invalidate any in-flight send/edit request
    setIsThinking(false)
    setStreamingMessageId(null)
  }, [])

  const handleStreamDone = useCallback((messageId: string) => {
    setStreamingMessageId((current) => (current === messageId ? null : current))
  }, [])

  const rateMessage = useCallback(
    (messageId: string, rating: FeedbackRating) => {
      api.submitFeedback({ scope: "response", chatId: activeChatId ?? undefined, messageId, rating })
    },
    [api, activeChatId]
  )

  const submitFeedback = useCallback(
    (rating: FeedbackRating | undefined, comment: string) => {
      if (!feedbackModal) return
      api.submitFeedback({ ...feedbackModal, rating, comment: comment || undefined })
      setFeedbackModal(null)
    },
    [api, feedbackModal]
  )

  if (!navUser) {
    return <div className="app-loading">Loading…</div>
  }

  return (
    <ThemeProvider>
      <div className="app-shell">
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          navUser={navUser}
          collapsed={sidebarCollapsed}
          sheet={isNarrow}
          onNewChat={startNewChat}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onTogglePinChat={togglePinChat}
          onArchiveChat={archiveChat}
          onRenameChat={renameChat}
          onOpenSettings={() => setView("settings")}
          onGiveAppFeedback={() => setFeedbackModal({ scope: "app" })}
          onToggleCollapse={toggleSidebar}
        />

        {isNarrow && !sidebarCollapsed && (
          <div className="sidebar-backdrop" onClick={toggleSidebar} />
        )}

        <main className="app-main">
          {view === "settings" ? (
            <SettingsPage
              navUser={navUser}
              onBack={() => setView("chat")}
              onChatUnarchived={unarchiveChat}
              sidebarCollapsed={sidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />
          ) : (
            <>
              <div className="chat-view__header">
                <div className="chat-view__header-left">
                  {sidebarCollapsed && (
                    <button
                      type="button"
                      className="sidebar-toggle"
                      onClick={toggleSidebar}
                      aria-label="Expand sidebar"
                    >
                      <PanelLeftOpen size={16} />
                    </button>
                  )}
                  <span className="chat-view__header-title">
                    {chats.find((c) => c.id === activeChatId)?.title ?? "New chat"}
                  </span>
                </div>
              </div>
              <ChatView
                navUser={navUser}
                messages={messages}
                isThinking={isThinking}
                streamingMessageId={streamingMessageId}
                onStreamDone={handleStreamDone}
                onSend={sendMessage}
                onStop={stopGenerating}
                onEditMessage={editMessage}
                onRegenerateMessage={regenerateMessage}
                onRateMessage={rateMessage}
                onGiveMessageFeedback={(messageId) =>
                  setFeedbackModal({ scope: "response", chatId: activeChatId ?? undefined, messageId })
                }
              />
            </>
          )}
        </main>

        {feedbackModal && (
          <FeedbackModal
            state={feedbackModal}
            onClose={() => setFeedbackModal(null)}
            onSubmit={submitFeedback}
          />
        )}
      </div>
    </ThemeProvider>
  )
}
