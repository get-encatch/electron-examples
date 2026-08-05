import { useState } from "react"
import { Check, Copy, MessageSquare, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react"
import type { FeedbackRating } from "@encatch/core"

interface MessageActionsProps {
  alwaysVisible?: boolean
  onRate: (rating: FeedbackRating) => void
  onGiveDetailedFeedback: () => void
  onCopy: () => void
  onRegenerate?: () => void
}

const ICON_SIZE = 15

export function MessageActions({
  alwaysVisible = false,
  onRate,
  onGiveDetailedFeedback,
  onCopy,
  onRegenerate
}: MessageActionsProps) {
  const [rated, setRated] = useState<FeedbackRating | null>(null)
  const [copied, setCopied] = useState(false)

  return (
    <div
      className={"message-actions" + (alwaysVisible ? " message-actions--always-visible" : "")}
      role="group"
      aria-label="Response actions"
    >
      <button
        type="button"
        className="message-actions__btn"
        onClick={() => {
          onCopy()
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        title="Copy response"
        aria-label="Copy response"
      >
        {copied ? <Check size={ICON_SIZE} /> : <Copy size={ICON_SIZE} />}
      </button>
      <button
        type="button"
        className={"message-actions__btn" + (rated === "up" ? " message-actions__btn--active" : "")}
        onClick={() => {
          setRated("up")
          onRate("up")
        }}
        title="Good response"
        aria-label="Good response"
        aria-pressed={rated === "up"}
      >
        <ThumbsUp size={ICON_SIZE} />
      </button>
      <button
        type="button"
        className={"message-actions__btn" + (rated === "down" ? " message-actions__btn--active" : "")}
        onClick={() => {
          setRated("down")
          onRate("down")
        }}
        title="Bad response"
        aria-label="Bad response"
        aria-pressed={rated === "down"}
      >
        <ThumbsDown size={ICON_SIZE} />
      </button>
      <button
        type="button"
        className="message-actions__btn"
        onClick={onGiveDetailedFeedback}
        title="Give detailed feedback on this response"
        aria-label="Give detailed feedback on this response"
      >
        <MessageSquare size={ICON_SIZE} />
      </button>
      {onRegenerate && (
        <button
          type="button"
          className="message-actions__btn"
          onClick={onRegenerate}
          title="Regenerate response"
          aria-label="Regenerate response"
        >
          <RotateCcw size={ICON_SIZE} />
        </button>
      )}
    </div>
  )
}
