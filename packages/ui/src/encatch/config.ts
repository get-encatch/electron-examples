import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_ENCATCH_PUBLISHABLE_KEY: z.string().startsWith("en-pk_"),
    VITE_ENCATCH_FORM_ID: z.string().min(1),
    VITE_ENCATCH_API_BASE_URL: z.url()
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true
})

export const ENCATCH_API_KEY = env.VITE_ENCATCH_PUBLISHABLE_KEY
export const ENCATCH_FEEDBACK_FORM_ID = env.VITE_ENCATCH_FORM_ID
export const ENCATCH_API_BASE_URL = env.VITE_ENCATCH_API_BASE_URL
