import { http } from '@/shared/api/httpClient'
import type { AuthUser, Session } from '@/entities/session'

export interface LoginCredentials {
  tenantSlug: string
  email: string
  password: string
}

/**
 * Forma cruda de la respuesta del backend.
 *
 * El backend nombra su dominio en español y no conoce el modelo de sesión de
 * este front. La traducción vive acá, en la capa `api`: hacia adentro del
 * front solo circula `Session`, y si el contrato del servidor cambia, este es
 * el único archivo a tocar.
 */
interface LoginResponseBackend {
  accessToken: string
  usuario: {
    id: string
    email: string
    nombreCompleto: string
    rol: string
    tenantId: string
  }
}

/** El backend solo emite ADMINISTRADOR y PROFESIONAL; 'recepcion' aún no existe. */
const ROLES: Record<string, AuthUser['role']> = {
  ADMINISTRADOR: 'admin',
  PROFESIONAL: 'profesional',
}

export type LoginResponse = Session

/** POST /auth/login con tenantSlug + email + contraseña. */
export async function login(credentials: LoginCredentials): Promise<Session> {
  const res = await http.post<LoginResponseBackend>('/auth/login', credentials)

  return {
    token: res.accessToken,
    user: {
      id: res.usuario.id,
      email: res.usuario.email,
      name: res.usuario.nombreCompleto,
      // Ante un rol desconocido se asume el menos privilegiado.
      role: ROLES[res.usuario.rol] ?? 'profesional',
    },
  }
}

/**
 * Login con Google Workspace.
 * TODO: integrar el flujo OAuth real (redirect o popup) cuando esté el backend.
 * Por ahora es un stub para no bloquear el desarrollo del resto del login.
 */
export function loginWithGoogle(): Promise<LoginResponse> {
  return Promise.reject(new Error('El acceso con Google Workspace aún no está disponible.'))
}
