import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { removeToken, setToken } from '@/shared/lib/authToken'
import type { AuthUser } from './types'

/**
 * Estado de la sesión actual. Los DATOS del usuario son negocio y viven acá;
 * el TOKEN es infraestructura y se delega a `shared/lib/authToken`.
 */
export const useSessionStore = defineStore('session', () => {
  const currentUser = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => currentUser.value !== null)

  function setSession(user: AuthUser, token: string, persistent = false): void {
    currentUser.value = user
    setToken(token, persistent)
  }

  function clearSession(): void {
    currentUser.value = null
    removeToken()
  }

  return { currentUser, isAuthenticated, setSession, clearSession }
})
