import { http } from '@/shared/api/httpClient'
import type { AuthUser } from '@/entities/session'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  token: string
}

/** POST /auth/login con email + contraseña. */
export function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return http.post<LoginResponse>('/auth/login', credentials)
}

/**
 * Login con Google Workspace.
 * TODO: integrar el flujo OAuth real (redirect o popup) cuando esté el backend.
 * Por ahora es un stub para no bloquear el desarrollo del resto del login.
 */
export function loginWithGoogle(): Promise<LoginResponse> {
  return Promise.reject(new Error('El acceso con Google Workspace aún no está disponible.'))
}
