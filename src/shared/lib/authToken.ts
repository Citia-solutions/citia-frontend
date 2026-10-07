/**
 * El token de autenticación es infraestructura, no negocio: por eso vive en
 * `shared` y no en `entities/session`. Así el httpClient (también en shared)
 * puede leerlo sin romper la regla de capas de FSD.
 *
 * "Mantener sesión iniciada" decide dónde se persiste:
 *  - persistent = true  → localStorage   (sobrevive al cierre del navegador y
 *                                          lo ven las demás pestañas)
 *  - persistent = false → sessionStorage (solo esta pestaña; se borra al cerrarla)
 *
 * Los datos del usuario NO se guardan aquí: los guarda `entities/session` junto
 * al token, con la misma regla de almacenamiento.
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

/** Lo que el front necesita leer del JWT. El backend firma `{ sub, email, tenantId, rol, exp }`. */
export interface TokenClaims {
  /** Id del usuario dueño del token. */
  sub: string
  /** Vencimiento en segundos desde epoch; `null` si el token no lo trae. */
  exp: number | null
}

/**
 * Lee el payload del JWT **sin verificar la firma**: eso lo hace el backend en
 * cada petición. Sirve solo para saber de quién es y cuándo vence, y así no
 * restaurar una sesión que el servidor igual va a rechazar.
 *
 * Devuelve `null` si el texto no tiene forma de JWT o no trae `sub`.
 */
export function readTokenClaims(token: string): TokenClaims | null {
  const payload = token.split('.')[1]
  if (!payload) return null

  try {
    // base64url → base64 con relleno, y los bytes como UTF-8 (el email puede tener tildes).
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes))

    if (typeof claims !== 'object' || claims === null) return null
    const { sub, exp } = claims as Record<string, unknown>
    if (typeof sub !== 'string' || !sub) return null

    return { sub, exp: typeof exp === 'number' ? exp : null }
  } catch {
    return null
  }
}

/** `true` si el token ya venció según su `exp`. Un token sin `exp` no vence por sí solo. */
export function isTokenExpired(claims: TokenClaims, now: number = Date.now()): boolean {
  return claims.exp !== null && claims.exp * 1000 <= now
}
