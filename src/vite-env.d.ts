/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_LOGIN_PAGE?: string
  readonly VITE_WS_BASE_URL?: string
  readonly VITE_WS_URL?: string
  readonly VITE_ADMIN_PREFIX?: string
  readonly VITE_DEV_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

