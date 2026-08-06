import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

const FAKE_MODELS = [
  "GPT 5.2",
  "Claude Sonnet 5",
  "Gemini 3 Pro",
  "Grok 4",
  "Llama 4 Maverick",
  "Mistral Large",
  "DeepSeek V3"
]

export function ModelSelector() {
  const [open, setOpen] = useState(false)
  const [model, setModel] = useState(FAKE_MODELS[0])
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickAway = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickAway)
    return () => document.removeEventListener("mousedown", onClickAway)
  }, [open])

  return (
    <div className="model-selector" ref={rootRef}>
      {open && (
        <div className="model-selector__menu" role="menu">
          {FAKE_MODELS.map((name) => (
            <button
              key={name}
              type="button"
              role="menuitem"
              className={
                "model-selector__menu-item" + (name === model ? " model-selector__menu-item--active" : "")
              }
              onClick={() => {
                setModel(name)
                setOpen(false)
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <button type="button" className="model-selector__trigger" onClick={() => setOpen((v) => !v)}>
        {model}
        <ChevronDown className="model-selector__chevron" size={13} aria-hidden />
      </button>
    </div>
  )
}
