import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getToken, isTokenExpired, readTokenClaims, removeToken, setToken } from '@/shared/lib/authToken'
import { loadUser, removeUser, saveUser } from './storedUser'
import type { AuthUser } from './types'

/**
 * Estado de la sesión actual. Los DATOS del usuario son negocio y viven acá;
 * el TOKEN es infraestructura y se delega a `shared/lib/authToken`.
 *
 * Los dos se persisten juntos y en el mismo almacenamiento (ver `storedUser.ts`),
 * y `restoreSession()` los vuelve a leer: así un F5, o una pestaña nueva si se
 * eligió "Mantener sesión iniciada", conservan la sesión sin `GET /me`.
 */
export const useSessionStore = defineStore('session', () => {
  const currentUser = ref<AuthUser | null>(null)

  // `!= null` a propósito: un `undefined` colado tampoco es una sesión (DTF-01).
  const isAuthenticated = computed(() => currentUser.value != null)

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

  return { currentUser, isAuthenticated, setSession, clearSession, restoreSession }
})
