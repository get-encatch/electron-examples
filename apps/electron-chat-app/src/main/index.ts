import { app, BrowserWindow, shell } from "electron"
import { join } from "node:path"
import { electronApp, is, optimizer } from "@electron-toolkit/utils"
import { openDatabase } from "./db"
import { createChatApi } from "./chatApi"
import { registerChatApiIpc } from "./ipc"

const devIconPath = join(__dirname, "../../build/icon.png")

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 720,
    minHeight: 520,
    show: false,
    autoHideMenuBar: true,
    icon: is.dev ? devIconPath : undefined,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  })

  window.on("ready-to-show", () => window.show())

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    window.loadURL(process.env["ELECTRON_RENDERER_URL"])
  } else {
    window.loadFile(join(__dirname, "../renderer/index.html"))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.encatch.electron-chat-app")

  if (is.dev && process.platform === "darwin") {
    app.dock?.setIcon(devIconPath)
  }

  app.on("browser-window-created", (_event, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const db = openDatabase()
  const chatApi = createChatApi(db)
  registerChatApiIpc(chatApi)

  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
