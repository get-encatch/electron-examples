import { useEffect, useRef, useState } from "react"
import type { NavUser } from "@encatch/core"

interface UserNavProps {
  user: NavUser
  onOpenSettings: () => void
  onGiveAppFeedback: () => void
}

export function UserNav({ user, onOpenSettings, onGiveAppFeedback }: UserNavProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickAway = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickAway)
    return () => document.removeEventListener("mousedown", onClickAway)
  }, [open])

  const initial = user.name.trim().charAt(0).toUpperCase() || "?"

  return (
    <div className="user-nav" ref={rootRef}>
      {open && (
        <div className="user-nav__menu" role="menu">
          <div className="user-nav__menu-header">
            <div className="user-nav__avatar user-nav__avatar--menu">{initial}</div>
            <div>
              <div className="user-nav__menu-name">{user.name}</div>
              <div className="user-nav__menu-plan">{user.planLabel}</div>
            </div>
          </div>
          <div className="user-nav__menu-divider" />
          <button
            type="button"
            className="user-nav__menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Claude
          </button>
          <button
            type="button"
            className="user-nav__menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onOpenSettings()
            }}
          >
            Settings
          </button>
          <div className="user-nav__menu-divider" />
          <button
            type="button"
            className="user-nav__menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onGiveAppFeedback()
            }}
          >
            Give feedback
          </button>
        </div>
      )}
      <button type="button" className="user-nav__trigger" onClick={() => setOpen((v) => !v)}>
        <span className="user-nav__avatar">{initial}</span>
        <span className="user-nav__name">{user.name}</span>
      </button>
    </div>
  )
}
