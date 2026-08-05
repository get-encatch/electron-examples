const MAX_TITLE_LENGTH = 48

/** Derives a chat's subject/title from the first user message, Claude-style. */
export function deriveChatTitle(firstMessage: string): string {
  const firstLine = firstMessage.trim().split("\n")[0].trim()
  if (firstLine.length <= MAX_TITLE_LENGTH) {
    return firstLine.length > 0 ? firstLine : "New chat"
  }
  return firstLine.slice(0, MAX_TITLE_LENGTH - 1).trimEnd() + "…"
}
