// API pública del slice `session`. Desde fuera SIEMPRE se importa desde aquí,
// nunca apuntando a archivos internos (model/, api/).
export { useSessionStore } from './model/store'
export { fetchCurrentUser } from './api/sessionApi'
export type { AuthUser, Session } from './model/types'
