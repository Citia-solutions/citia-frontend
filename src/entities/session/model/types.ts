/** Usuario autenticado (lo mínimo que necesita el front para la sesión). */
export interface AuthUser {
  id: string
  email: string
  name: string
  /** Rol dentro del centro clínico. Ajustar a los roles reales del backend. */
  role: 'admin' | 'profesional' | 'recepcion'
  /**
   * Slug de la organización (`usuario.tenantSlug` del login, desde el cierre de
   * Fase 1). Arma el enlace público `/agendar-cita/:tenantSlug`. Opcional: una
   * sesión iniciada contra un backend anterior no lo tiene, y entonces el botón
   * "Copiar enlace de agenda" no se muestra.
   */
  tenantSlug?: string
}

/** Una sesión = el usuario + su token de acceso. */
export interface Session {
  user: AuthUser
  token: string
}
