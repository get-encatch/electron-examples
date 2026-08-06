import type { ElectronAPI } from "@electron-toolkit/preload"
import type { ChatApi } from "@encatch/core"

declare global {
  interface Window {
    electron: ElectronAPI
    chatApi: ChatApi
  }
}
