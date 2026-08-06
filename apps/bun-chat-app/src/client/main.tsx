import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@encatch/ui/src/styles.css"
import { httpChatApi } from "./httpChatApi"

async function bootstrap() {
  const response = await fetch("/api/client-env")
  if (!response.ok) throw new Error("Failed to load client environment")

  window.__ENCATCH_ENV__ = await response.json()

  const { App, ApiProvider } = await import("@encatch/ui")
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ApiProvider api={httpChatApi}>
        <App />
      </ApiProvider>
    </StrictMode>
  )
}

bootstrap().catch((error) => {
  console.error(error)
  createRoot(document.getElementById("root")!).render(
    <div className="app-loading">Unable to start the application.</div>
  )
})
