import type { Router } from 'vue-router'
import { useSessionStore } from '@/entities/session'

/**
 * Cierra la sesión y lleva al login. Lo usan el botón "Cerrar sesión" del
 * sidebar y el manejo global del 401 (`app/providers`).
 *
 * Navega con una **carga completa** de la página y no con `router.push`: así no
 * queda en memoria (stores de Pinia) nada del usuario anterior —citas,
 * solicitudes, configuración— que alcance a verse si otra persona inicia
 * sesión después en la misma pestaña.
 *
 * Recibe el router por parámetro (no lo importa) para no cerrar un ciclo
 * `router → PanelLayout → PanelSidebar → router`.
 *
 * @param redirect ruta interna a la que volver tras iniciar sesión de nuevo.
 */
export function cerrarSesion(router: Router, redirect?: string): void {
  useSessionStore().clearSession()
  const { href } = router.resolve({ name: 'login', query: redirect ? { redirect } : {} })
  window.location.assign(href)
}
