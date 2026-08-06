import { useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { initEncatch, setEncatchTheme } from "./sdk"

export function EncatchThemeBridge() {
  const { theme } = useTheme()

  useEffect(() => {
    initEncatch(theme)
    setEncatchTheme(theme)
  }, [theme])

  return null
}
