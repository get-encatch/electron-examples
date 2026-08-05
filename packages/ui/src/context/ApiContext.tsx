import { createContext, useContext, type ReactNode } from "react"
import type { ChatApi } from "@encatch/core"

const ApiContext = createContext<ChatApi | null>(null)

export function ApiProvider({ api, children }: { api: ChatApi; children: ReactNode }) {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
}

export function useChatApi(): ChatApi {
  const api = useContext(ApiContext)
  if (!api) {
    throw new Error("useChatApi must be used within an <ApiProvider>")
  }
  return api
}
