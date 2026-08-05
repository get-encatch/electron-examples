import { useState } from "react"
import { ThumbsDown, ThumbsUp, X } from "lucide-react"
import type { FeedbackRating, FeedbackScope } from "@encatch/core"

export interface FeedbackModalState {
  scope: FeedbackScope
  chatId?: string
  messageId?: string
}

interface FeedbackModalProps {
  state: FeedbackModalState
  onClose: () => void
  onSubmit: (rating: FeedbackRating | undefined, comment: string) => void
}

const SCOPE_COPY: Record<FeedbackScope, { title: string; subtitle: string }> = {
  response: {
    title: "Give feedback on this response",
    subtitle: "Powered by the encatch SDK (coming soon) — this is a UI concept only."
  },
  conversation: {
    title: "Give feedback on this conversation",
    subtitle: "Powered by the encatch SDK (coming soon) — this is a UI concept only."
  },
  app: {
    title: "Give feedback on Encatch",
    subtitle: "Powered by the encatch SDK (coming soon) — this is a UI concept only."
  }
}

export function FeedbackModal({ state, onClose, onSubmit }: FeedbackModalProps) {
  const [rating, setRating] = useState<FeedbackRating | undefined>(undefined)
  const [comment, setComment] = useState("")
  const copy = SCOPE_COPY[state.scope]

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{copy.title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="modal__subtitle">{copy.subtitle}</p>

        <div className="modal__ratings">
          <button
            type="button"
            className={"modal__rating-btn" + (rating === "up" ? " modal__rating-btn--active" : "")}
            onClick={() => setRating("up")}
          >
            <ThumbsUp size={14} /> Good
          </button>
          <button
            type="button"
            className={"modal__rating-btn" + (rating === "down" ? " modal__rating-btn--active" : "")}
            onClick={() => setRating("down")}
          >
            <ThumbsDown size={14} /> Bad
          </button>
        </div>

        <textarea
          className="modal__textarea"
          placeholder="What went well, or what could be better?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />

        <div className="modal__actions">
          <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="modal__btn modal__btn--primary"
            onClick={() => onSubmit(rating, comment.trim())}
          >
            Submit feedback
          </button>
        </div>
      </div>
    </div>
  )
}
