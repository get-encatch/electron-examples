import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// Tauri expects a fixed dev server port (see src-tauri/tauri.conf.json's devUrl) and
// wants the host reachable from inside the webview, hence host: true / strictPort.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5183,
    strictPort: true,
    host: true
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG
  }
})
