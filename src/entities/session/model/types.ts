/** Usuario autenticado (lo mínimo que necesita el front para la sesión). */
export interface AuthUser {
  id: string
  email: string
  name: string
  /** Rol dentro del centro clínico. Ajustar a los roles reales del backend. */
  role: 'admin' | 'profesional' | 'recepcion'
}

/** Una sesión = el usuario + su token de acceso. */
export interface Session {
  user: AuthUser
  token: string
}
