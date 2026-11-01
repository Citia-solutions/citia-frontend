import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getToken,
  isTokenExpired,
  isTokenPersistent,
  readTokenClaims,
  removeToken,
  replaceToken as replaceStoredToken,
  setToken,
} from '@/shared/lib/authToken'
import { loadUser, removeUser, saveUser } from './storedUser'
import type { AuthUser } from './types'

/**
 * Estado de la sesión actual. Los DATOS del usuario son negocio y viven acá;
 * el TOKEN es infraestructura y se delega a `shared/lib/authToken`.
 *
 * Los dos se persisten juntos y en el mismo almacenamiento (ver `storedUser.ts`),
 * y `restoreSession()` los vuelve a leer: así un F5, o una pestaña nueva si se
 * eligió "Mantener sesión iniciada", conservan la sesión. Desde US-10 el
 * backend tiene `GET /usuarios/me`, pero no se pide en cada navegación: solo
 * Mi Perfil lo pide y refresca la sesión con `updateUser`.
 */
export const useSessionStore = defineStore('session', () => {
  const currentUser = ref<AuthUser | null>(null)

  // `!= null` a propósito: un `undefined` colado tampoco es una sesión (DTF-01).
  const isAuthenticated = computed(() => currentUser.value != null)

  /**
   * El usuario es administrador de su organización (`ADMINISTRADOR` del
   * backend, traducido a `'admin'` en el login). Solo decide qué se **muestra**
   * (US-10: la pestaña Suscripción); el permiso lo decide el backend (403).
   */
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  function setSession(user: AuthUser, token: string, persistent = false): void {
    // Una sesión a medias explota aquí, donde nace, y no tres pantallas después
    // como un 401 (DTF-01).
    if (!user?.id || !token) throw new Error('setSession: falta el usuario o el token.')

    setToken(token, persistent)
    saveUser(user, persistent)
    currentUser.value = user
  }

  function clearSession(): void {
    currentUser.value = null
    removeToken()
    removeUser()
  }

  /**
   * Rehidrata `currentUser` desde el almacenamiento. Lo llama el guard del router
   * antes de decidir cada navegación, así que también recoge lo que cambió en
   * otra pestaña (un cierre de sesión, otro inicio de sesión).
   *
   * Si lo guardado no sirve —falta el token o el usuario, el JWT no se puede
   * leer o ya venció, o el token es de otro usuario— limpia todo y devuelve
   * `false`; el guard manda al login.
   */
  function restoreSession(): boolean {
    const token = getToken()
    const claims = token ? readTokenClaims(token) : null
    const user = claims ? loadUser() : null

    if (!claims || !user || claims.sub !== user.id || isTokenExpired(claims)) {
      clearSession()
      return false
    }

    // Solo se reemplaza si cambió: evita re-render del sidebar en cada navegación.
    if (JSON.stringify(currentUser.value) !== JSON.stringify(user)) currentUser.value = user
    return true
  }

  /**
   * Refresca los datos visibles del usuario (US-10: con la respuesta de
   * `GET` o `PATCH /usuarios/me`), en memoria **y** en `citia.user`, en el
   * mismo almacenamiento que el token. Las dos cosas: `restoreSession` corre en
   * cada navegación y volvería a poner lo guardado.
   *
   * - Sin sesión, no hace nada.
   * - Nunca toca `id`, `email` ni `role`.
   * - `tenantSlug` o `tenantNombre` ausentes (`undefined`) no cambian; vacíos
   *   se quitan, como al restaurar.
   * - Si el token guardado ya no es de este usuario (otra pestaña cerró la
   *   sesión o entró con otra cuenta), no escribe nada: la próxima navegación
   *   recoge lo que haya guardado.
   */
  function updateUser(cambios: Pick<AuthUser, 'name' | 'tenantSlug' | 'tenantNombre'>): void {
    const user = currentUser.value
    if (!user || !tokenGuardadoEsDe(user.id)) return

    const tenantSlug = cambios.tenantSlug !== undefined ? cambios.tenantSlug : user.tenantSlug
    const tenantNombre = cambios.tenantNombre !== undefined ? cambios.tenantNombre : user.tenantNombre

    // Misma forma y orden que `loadUser`, para que `restoreSession` lo vea igual.
    const nuevo: AuthUser = {
      id: user.id,
      email: user.email,
      name: cambios.name,
      role: user.role,
      ...(tenantSlug ? { tenantSlug } : {}),
      ...(tenantNombre ? { tenantNombre } : {}),
    }

    saveUser(nuevo, isTokenPersistent())
    currentUser.value = nuevo
  }

  /**
   * Cambia el token de la sesión actual por uno nuevo del **mismo** usuario
   * (US-10: el `accessToken` del cambio de contraseña), en el almacenamiento en
   * que está. No reescribe `citia.user`.
   *
   * Lanza si el token no se puede leer o su `sub` no es el usuario de la
   * sesión, como `setSession` con una sesión a medias. Si el token guardado ya
   * no es de este usuario (cambió en otra pestaña), no escribe nada.
   */
  function replaceToken(token: string): void {
    const user = currentUser.value
    if (!user || readTokenClaims(token)?.sub !== user.id) {
      throw new Error('replaceToken: el token no es del usuario de la sesión.')
    }
    if (!tokenGuardadoEsDe(user.id)) return

    replaceStoredToken(token)
  }

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    setSession,
    clearSession,
    restoreSession,
    updateUser,
    replaceToken,
  }
})

/** ¿El token guardado (de cualquier almacenamiento) es de este usuario? */
function tokenGuardadoEsDe(userId: string): boolean {
  const token = getToken()
  return token !== null && readTokenClaims(token)?.sub === userId
}
