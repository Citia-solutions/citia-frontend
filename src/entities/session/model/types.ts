/**
 * Rol dentro del centro clínico. Son los dos que emite el backend
 * (`ADMINISTRADOR` → `admin`, `PROFESIONAL` → `profesional`); un rol nuevo se
 * agrega aquí, en la traducción de `features/auth/api/authApi.ts` y en
 * `ROLE_LABELS` (`./role.ts`).
 */
export type UserRole = 'admin' | 'profesional'

/** Usuario autenticado (lo mínimo que necesita el front para la sesión). */
export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  /**
   * Slug de la organización (`usuario.tenantSlug` del login, desde el cierre de
   * Fase 1). Arma el enlace público `/agendar-cita/:tenantSlug`. Opcional: una
   * sesión iniciada contra un backend anterior no lo tiene, y entonces el botón
   * "Copiar enlace de agenda" no se muestra.
   */
  tenantSlug?: string
  /**
   * Nombre visible de la organización (`usuario.tenantNombre` del login, desde
   * 2026-10-05). Lo muestra el sidebar bajo "Citia". Opcional por la misma razón
   * que `tenantSlug`: si no viene, esa línea no se muestra.
   */
  tenantNombre?: string
}

/** Una sesión = el usuario + su token de acceso. */
export interface Session {
  user: AuthUser
  token: string
}
