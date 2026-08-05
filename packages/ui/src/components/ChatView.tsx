import { useEffect, useRef, useState } from "react"
import { ArrowDown } from "lucide-react"
import type { FeedbackRating, Message, NavUser } from "@encatch/core"
import { MessageBubble } from "./MessageBubble"
import { Composer } from "./Composer"
import { EmptyState } from "./EmptyState"

interface ChatViewProps {
  navUser: NavUser
  messages: Message[]
  isThinking: boolean
  streamingMessageId: string | null
  onStreamDone: (messageId: string) => void
  onSend: (text: string) => void
  onStop: () => void
  onEditMessage: (messageId: string, text: string) => void
  onRegenerateMessage: (messageId: string) => void
  onRateMessage: (messageId: string, rating: FeedbackRating) => void
  onGiveMessageFeedback: (messageId: string) => void
}

const NEAR_BOTTOM_THRESHOLD_PX = 80

export function ChatView({
  navUser,
  messages,
  isThinking,
  streamingMessageId,
  onStreamDone,
  onSend,
  onStop,
  onEditMessage,
  onRegenerateMessage,
  onRateMessage,
  onGiveMessageFeedback
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const [showJumpToBottom, setShowJumpToBottom] = useState(false)

  const checkNearBottom = () => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX
    isNearBottomRef.current = nearBottom
    setShowJumpToBottom(!nearBottom)
  }

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
    isNearBottomRef.current = true
    setShowJumpToBottom(false)
  }

  useEffect(() => {
    scrollToBottom("auto")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  useEffect(() => {
    if (isNearBottomRef.current) scrollToBottom("auto")
  }, [isThinking])

  const handleStreamTick = () => {
    if (isNearBottomRef.current) scrollToBottom("auto")
  }

  const isGenerating = isThinking || streamingMessageId !== null
  const lastUserMessageId = [...messages].reverse().find((m) => m.role === "user")?.id ?? null

  if (messages.length === 0) {
    return (
      <div className="chat-view chat-view--empty">
        <div className="chat-view__centered">
          <EmptyState navUser={navUser} />
          <Composer isGenerating={isGenerating} onSend={onSend} onStop={onStop} />
        </div>
      </div>
    )
  }

  return (
    <div className="chat-view">
      <div className="chat-view__scroll" ref={scrollRef} onScroll={checkNearBottom}>
        <div className="chat-view__messages">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
              isLastUserMessage={message.id === lastUserMessageId}
              canEditOrRegenerate={!isGenerating}
              streaming={message.id === streamingMessageId}
              onStreamTick={handleStreamTick}
              onStreamDone={() => onStreamDone(message.id)}
              onRate={(rating) => onRateMessage(message.id, rating)}
              onGiveDetailedFeedback={() => onGiveMessageFeedback(message.id)}
              onEdit={(text) => onEditMessage(message.id, text)}
              onRegenerate={() => onRegenerateMessage(message.id)}
            />
          ))}
          {isThinking && (
            <div className="message message--assistant">
              <div className="message__body">
                <div className="message__bubble message__bubble--thinking">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showJumpToBottom && (
        <button
          type="button"
          className="chat-view__jump-to-bottom"
          onClick={() => scrollToBottom()}
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={16} />
        </button>
      )}
      <Composer isGenerating={isGenerating} onSend={onSend} onStop={onStop} />
    </div>
  )
}
