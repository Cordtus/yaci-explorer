/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTGREST_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_NAME_SHORT?: string
  readonly VITE_LOGO_URL?: string
  readonly VITE_FAVICON_URL?: string
  readonly VITE_PRIMARY_COLOR?: string
  readonly VITE_ACCENT_COLOR?: string
  readonly VITE_FOOTER_TEXT?: string
  readonly VITE_LINK_WEBSITE?: string
  readonly VITE_LINK_DOCS?: string
  readonly VITE_LINK_GITHUB?: string
  readonly VITE_LINK_DISCORD?: string
  readonly VITE_LINK_TWITTER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
