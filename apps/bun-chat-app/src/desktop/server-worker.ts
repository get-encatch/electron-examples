import { startServer } from "../server/createServer"

// Port 0 lets the OS pick a free port — the desktop shell never needs a fixed one,
// since the webview navigates straight to whatever URL comes back.
const server = startServer(0)

postMessage({ type: "ready", url: server.url.toString() })
