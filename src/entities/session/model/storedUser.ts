import { isUserRole } from './role'
import type { AuthUser } from './types'

/**
 * Persistencia de los datos del usuario, **junto al token y en el mismo
 * almacenamiento** (misma regla que `shared/lib/authToken`): con "Mantener
 * sesión iniciada" van a `localStorage`, si no a `sessionStorage`.
 *
 * Existe porque el backend no tiene `GET /me`: el usuario de la respuesta del
 * login es lo único que hay para rehidratar la sesión al recargar.
 */
const USER_KEY = 'citia.user'

export function saveUser(user: AuthUser, persistent = false): void {
  removeUser()
  const storage = persistent ? localStorage : sessionStorage
  storage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * El usuario guardado, o `null` si no hay o no tiene la forma esperada (JSON
 * roto, campos faltantes, un rol que ya no existe). Quien llama decide qué
 * hacer con un `null`: hoy, limpiar la sesión.
 */
export function loadUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
  if (raw === null) return null

  try {
    return toAuthUser(JSON.parse(raw))
  } catch {
    return null
  }
}

export function removeUser(): void {
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(USER_KEY)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function toAuthUser(value: unknown): AuthUser | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>

  if (!isNonEmptyString(v.id) || !isNonEmptyString(v.email) || typeof v.name !== 'string') {
    return null
  }
  if (!isUserRole(v.role)) return null

  return {
    id: v.id,
    email: v.email,
    name: v.name,
    role: v.role,
    ...(isNonEmptyString(v.tenantSlug) ? { tenantSlug: v.tenantSlug } : {}),
    ...(isNonEmptyString(v.tenantNombre) ? { tenantNombre: v.tenantNombre } : {}),
  }
}
