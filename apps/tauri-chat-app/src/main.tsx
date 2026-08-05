import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App, ApiProvider } from "@encatch/ui"
import "@encatch/ui/src/styles.css"
import { tauriChatApi } from "./tauriChatApi"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApiProvider api={tauriChatApi}>
      <App />
    </ApiProvider>
  </StrictMode>
)
