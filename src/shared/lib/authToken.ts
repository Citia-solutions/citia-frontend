/**
 * El token de autenticación es infraestructura, no negocio: por eso vive en
 * `shared` y no en `entities/session`. Así el httpClient (también en shared)
 * puede leerlo sin romper la regla de capas de FSD.
 *
 * "Mantener sesión iniciada" decide dónde se persiste:
 *  - persistent = true  → localStorage   (sobrevive al cierre del navegador)
 *  - persistent = false → sessionStorage (se borra al cerrar la pestaña)
 */
const TOKEN_KEY = 'citia.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string, persistent = false): void {
  // Limpiamos ambos storages primero para no dejar tokens duplicados/obsoletos.
  removeToken()
  const storage = persistent ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}
