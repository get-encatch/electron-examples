import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

interface EncatchRuntimeEnv {
  VITE_ENCATCH_PUBLISHABLE_KEY?: string
  VITE_ENCATCH_FORM_ID?: string
  VITE_ENCATCH_API_BASE_URL?: string
}

declare global {
  interface Window {
    __ENCATCH_ENV__?: EncatchRuntimeEnv
  }
}

const viteEnv = import.meta.env as EncatchRuntimeEnv
const injectedEnv = typeof window === "undefined" ? undefined : window.__ENCATCH_ENV__

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_ENCATCH_PUBLISHABLE_KEY: z.string().startsWith("en-pk_"),
    VITE_ENCATCH_FORM_ID: z.string().min(1),
    VITE_ENCATCH_API_BASE_URL: z.url()
  },
  runtimeEnv: {
    VITE_ENCATCH_PUBLISHABLE_KEY:
      viteEnv.VITE_ENCATCH_PUBLISHABLE_KEY ?? injectedEnv?.VITE_ENCATCH_PUBLISHABLE_KEY,
    VITE_ENCATCH_FORM_ID: viteEnv.VITE_ENCATCH_FORM_ID ?? injectedEnv?.VITE_ENCATCH_FORM_ID,
    VITE_ENCATCH_API_BASE_URL:
      viteEnv.VITE_ENCATCH_API_BASE_URL ?? injectedEnv?.VITE_ENCATCH_API_BASE_URL
  },
  emptyStringAsUndefined: true
})

export const ENCATCH_API_KEY = env.VITE_ENCATCH_PUBLISHABLE_KEY
export const ENCATCH_FEEDBACK_FORM_ID = env.VITE_ENCATCH_FORM_ID
export const ENCATCH_API_BASE_URL = env.VITE_ENCATCH_API_BASE_URL
