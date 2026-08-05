import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App, ApiProvider } from "@encatch/ui"
import "@encatch/ui/src/styles.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApiProvider api={window.chatApi}>
      <App />
    </ApiProvider>
  </StrictMode>
)
