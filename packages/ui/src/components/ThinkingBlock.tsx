import { useState } from "react"
import { ChevronDown, Sparkles } from "lucide-react"
import { generateLoremReply } from "@encatch/core"

interface ThinkingBlockProps {
  seed: string
}

function fakeDuration(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return 2 + (Math.abs(hash) % 9)
}

export function ThinkingBlock({ seed }: ThinkingBlockProps) {
  const [open, setOpen] = useState(false)
  const seconds = fakeDuration(seed)

  return (
    <div className="thinking-block">
      <button
        type="button"
        className="thinking-block__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Sparkles className="thinking-block__mark" size={13} aria-hidden />
        Thought for {seconds}s
        <ChevronDown
          className={"thinking-block__chevron" + (open ? " thinking-block__chevron--open" : "")}
          size={13}
          aria-hidden
        />
      </button>
      {open && (
        <div className="thinking-block__body">
          {generateLoremReply(seed + ":thinking")
            .split("\n\n")[0]
            .split(". ")
            .map((s, i) => (
              <p key={i}>{s.trim().replace(/\.?$/, ".")}</p>
            ))}
        </div>
      )}
    </div>
  )
}
