import { _encatch } from "@encatch/web-sdk"
import type { NavUser } from "@encatch/core"
import { ENCATCH_API_BASE_URL, ENCATCH_API_KEY, ENCATCH_FEEDBACK_FORM_ID } from "./config"

type EncatchTheme = "light" | "dark" | "system"

let initialized = false

export function initEncatch(theme: EncatchTheme = "system") {
  if (initialized) return
  _encatch.init(ENCATCH_API_KEY, {
    theme,
    apiBaseUrl: ENCATCH_API_BASE_URL
  })
  initialized = true
}

export function setEncatchTheme(theme: EncatchTheme) {
  initEncatch(theme)
  _encatch.setTheme(theme)
}

export function identifyEncatchUser(user: NavUser) {
  initEncatch()
  _encatch.identifyUser(user.name, {
    $set: { name: user.name, plan: user.planLabel }
  })
}

export function showAppFeedbackForm() {
  initEncatch()
  _encatch.showForm(ENCATCH_FEEDBACK_FORM_ID)
}
