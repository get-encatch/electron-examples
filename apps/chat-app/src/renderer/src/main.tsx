import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App, ApiProvider } from "@encatch/ui"
import "@encatch/ui/src/styles.css"
import "./electron-chrome.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="electron-chrome">
      <div className="electron-chrome__drag-region" />
      <div className="electron-chrome__content">
        <ApiProvider api={window.chatApi}>
          <App />
        </ApiProvider>
      </div>
    </div>
  </StrictMode>
)
