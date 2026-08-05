import { useState, type KeyboardEvent } from "react"
import { ArrowUp, Paperclip, Plus, Square, X } from "lucide-react"
import { ModelSelector } from "./ModelSelector"

interface ComposerProps {
  isGenerating?: boolean
  onSend: (text: string) => void
  onStop?: () => void
}

interface FakeAttachment {
  id: string
  name: string
  size: string
}

const FAKE_FILES: FakeAttachment[] = [
  { id: "f1", name: "product-brief.pdf", size: "212 KB" },
  { id: "f2", name: "roadmap-notes.txt", size: "4 KB" },
  { id: "f3", name: "screenshot.png", size: "1.1 MB" }
]

export function Composer({ isGenerating = false, onSend, onStop }: ComposerProps) {
  const [value, setValue] = useState("")
  const [attachments, setAttachments] = useState<FakeAttachment[]>([])

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || isGenerating) return
    onSend(trimmed)
    setValue("")
    setAttachments([])
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const addFakeAttachment = () => {
    const unused = FAKE_FILES.find((f) => !attachments.some((a) => a.id === f.id))
    if (unused) setAttachments((prev) => [...prev, unused])
  }

  return (
    <div className="composer">
      <div className="composer__box">
        {attachments.length > 0 && (
          <div className="composer__attachments">
            {attachments.map((file) => (
              <div key={file.id} className="attachment-chip">
                <Paperclip className="attachment-chip__icon" size={13} aria-hidden />
                <span className="attachment-chip__name">{file.name}</span>
                <span className="attachment-chip__size">{file.size}</span>
                <button
                  type="button"
                  className="attachment-chip__remove"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setAttachments((prev) => prev.filter((f) => f.id !== file.id))}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          className="composer__input"
          placeholder="Message Encatch…"
          value={value}
          rows={1}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isGenerating}
        />
        <div className="composer__toolbar">
          <button
            type="button"
            className="composer__icon-btn"
            title="Attach a file"
            aria-label="Attach a file"
            onClick={addFakeAttachment}
            disabled={isGenerating || attachments.length >= FAKE_FILES.length}
          >
            <Plus size={16} />
          </button>
          <div className="composer__toolbar-spacer" />
          <ModelSelector />
          {isGenerating ? (
            <button type="button" className="composer__send" onClick={onStop} aria-label="Stop generating">
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              className="composer__send"
              disabled={value.trim().length === 0}
              onClick={submit}
              aria-label="Send message"
            >
              <ArrowUp size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="composer__hint">
        This is a concept UI. Responses are placeholder text, not real AI output.
      </div>
    </div>
  )
}
