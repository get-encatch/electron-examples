import { SizeHint, Webview } from "webview-bun"

/**
 * Desktop entry point: the Bun.serve backend runs on a worker thread (webview.run()
 * blocks the main thread with its native event loop), and a native webview window
 * navigates to it once it's listening. Same @encatch/core + @encatch/ui as the
 * browser shell — only the window chrome and transport differ from apps/chat-app.
 */
const worker = new Worker(new URL("./server-worker.ts", import.meta.url).href)

worker.onerror = (event) => {
  console.error("Failed to start the Bun server:", event)
  process.exit(1)
}

worker.onmessage = (event: MessageEvent<{ type: string; url: string }>) => {
  if (event.data.type !== "ready") return

  const webview = new Webview(false, { width: 1180, height: 800, hint: SizeHint.NONE })
  webview.title = "Encatch"
  webview.navigate(event.data.url)
  webview.run()

  worker.terminate()
  process.exit(0)
}
