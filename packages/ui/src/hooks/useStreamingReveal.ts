import { useEffect, useMemo, useState } from "react"

const WORD_INTERVAL_MS = 35

/**
 * Reveals `fullText` word-by-word to fake an LLM streaming response.
 * When `active` is false, the full text is shown immediately (used for
 * messages loaded from history, which never re-stream).
 */
export function useStreamingReveal(
  fullText: string,
  active: boolean,
  onTick?: () => void,
  onDone?: () => void
): string {
  const words = useMemo(() => fullText.split(/(?<=\s)/), [fullText])
  const [count, setCount] = useState(active ? 0 : words.length)

  useEffect(() => {
    if (!active) {
      setCount(words.length)
      return
    }
    setCount(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      setCount(i)
      onTick?.()
      if (i >= words.length) {
        clearInterval(id)
        onDone?.()
      }
    }, WORD_INTERVAL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullText, active, words])

  return words.slice(0, count).join("")
}
