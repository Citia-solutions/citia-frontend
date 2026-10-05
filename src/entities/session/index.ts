// API pública del slice `session`. Desde fuera SIEMPRE se importa desde aquí,
// nunca apuntando a archivos internos (model/).
export { useSessionStore } from './model/store'
export { roleLabel } from './model/role'
export type { AuthUser, Session, UserRole } from './model/types'
