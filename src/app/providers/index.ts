import type { App } from 'vue'
import { createPinia } from 'pinia'
import { onUnauthorized } from '@/shared/api/httpClient'
import { useSessionStore } from '@/entities/session'
import { router } from '@/app/router'
import { cerrarSesion } from '@/app/router/cerrarSesion'

/**
 * Registra los plugins globales de la app. Pinia primero, luego el router.
 *
 * La sesión guardada se restaura en el guard del router, que corre antes de la
 * primera vista (ver `app/router/index.ts`).
 */
export function registerProviders(app: App): void {
  app.use(createPinia())
  app.use(router)

  // 401 en una petición autenticada: el backend ya no acepta el token (venció,
  // o se cerró la sesión en otra pestaña). Se cierra la sesión y se vuelve al
  // login recordando dónde estaba. El login no pasa por aquí (`auth: false`).
  onUnauthorized(() => {
    const session = useSessionStore()
    // Varias peticiones suelen fallar juntas: solo la primera cierra la sesión.
    if (!session.isAuthenticated) return

    const actual = router.currentRoute.value
    if (!actual.meta.requiresAuth) {
      session.clearSession()
      return
    }
    cerrarSesion(router, actual.fullPath)
  })
}
