import { http } from '@/shared/api/httpClient'
import type { AuthUser } from '../model/types'

/** Recupera el usuario actual a partir del token guardado (GET /me). */
export function fetchCurrentUser(): Promise<AuthUser> {
  return http.get<AuthUser>('/me')
}
