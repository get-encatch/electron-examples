import { Sparkles } from "lucide-react"
import type { NavUser } from "@encatch/core"

export function EmptyState({ navUser }: { navUser: NavUser }) {
  return (
    <div className="empty-state">
      <Sparkles className="empty-state__mark" size={28} aria-hidden />
      <h1>Hi {navUser.name.split(" ")[0]}, what can I help with today?</h1>
      <p>Type a message below to start a new conversation.</p>
    </div>
  )
}
