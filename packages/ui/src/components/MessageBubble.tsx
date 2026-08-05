import { useState, type KeyboardEvent } from "react"
import { Pencil } from "lucide-react"
import type { FeedbackRating, Message } from "@encatch/core"
import { MessageActions } from "./MessageActions"
import { ThinkingBlock } from "./ThinkingBlock"
import { useStreamingReveal } from "../hooks/useStreamingReveal"

interface MessageBubbleProps {
  message: Message
  isLast?: boolean
  isLastUserMessage?: boolean
  canEditOrRegenerate?: boolean
  streaming?: boolean
  onStreamTick?: () => void
  onStreamDone?: () => void
  onRate: (rating: FeedbackRating) => void
  onGiveDetailedFeedback: () => void
  onEdit?: (text: string) => void
  onRegenerate?: () => void
}

export function MessageBubble({
  message,
  isLast = false,
  isLastUserMessage = false,
  canEditOrRegenerate = true,
  streaming = false,
  onStreamTick,
  onStreamDone,
  onRate,
  onGiveDetailedFeedback,
  onEdit,
  onRegenerate
}: MessageBubbleProps) {
  const isUser = message.role === "user"
  const revealed = useStreamingReveal(message.content, streaming && !isUser, onStreamTick, onStreamDone)
  const content = isUser ? message.content : revealed
  const isStreamingNow = streaming && !isUser && content.length < message.content.length

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)

  const startEdit = () => {
    setDraft(message.content)
    setIsEditing(true)
  }

  const submitEdit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== message.content) onEdit?.(trimmed)
    setIsEditing(false)
  }

  const onEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submitEdit()
    } else if (e.key === "Escape") {
      setIsEditing(false)
    }
  }

  if (isUser && isEditing) {
    return (
      <div className="message message--user">
        <div className="message__body message__body--editing">
          <textarea
            className="message-edit__textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onEditKeyDown}
            rows={Math.min(8, Math.max(2, draft.split("\n").length))}
            autoFocus
          />
          <div className="message-edit__actions">
            <button type="button" className="modal__btn modal__btn--ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button type="button" className="modal__btn modal__btn--primary" onClick={submitEdit}>
              Save & submit
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={"message" + (isUser ? " message--user" : " message--assistant")}>
      <div className="message__body">
        {!isUser && <ThinkingBlock seed={message.id} />}
        <div className={"message__bubble" + (isStreamingNow ? " message__bubble--streaming" : "")}>
          {content.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        {isUser && isLastUserMessage && canEditOrRegenerate && (
          <div className="message-actions message-actions--user">
            <button
              type="button"
              className="message-actions__btn"
              onClick={startEdit}
              title="Edit message"
              aria-label="Edit message"
            >
              <Pencil size={14} />
            </button>
          </div>
        )}
        {!isUser && !isStreamingNow && (
          <MessageActions
            alwaysVisible={isLast}
            onRate={onRate}
            onGiveDetailedFeedback={onGiveDetailedFeedback}
            onCopy={() => navigator.clipboard?.writeText(message.content)}
            onRegenerate={isLast && canEditOrRegenerate ? onRegenerate : undefined}
          />
        )}
      </div>
    </div>
  )
}
