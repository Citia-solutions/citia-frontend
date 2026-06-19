/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL del backend. Ej: https://api.citia.cl. Por defecto "/api". */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
