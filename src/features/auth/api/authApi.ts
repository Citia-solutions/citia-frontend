import { http } from '@/shared/api/httpClient'
import type { Session, UserRole } from '@/entities/session'

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
    /** Aditivo desde el cierre de Fase 1; un backend anterior no lo manda. */
    tenantSlug?: string
    /** Aditivo desde 2026-10-05 (nombre visible de la organización); ídem. */
    tenantNombre?: string
  }
}

/** El backend solo emite ADMINISTRADOR y PROFESIONAL. */
const ROLES: Record<string, UserRole> = {
  ADMINISTRADOR: 'admin',
  PROFESIONAL: 'profesional',
}

export type LoginResponse = Session

/**
 * POST /auth/login con tenantSlug + email + contraseña.
 *
 * Va con `{ auth: false }`: es una ruta pública, y así un 401 aquí ("credenciales
 * inválidas") no se confunde con una sesión vencida ni dispara el cierre global.
 */
export async function login(credentials: LoginCredentials): Promise<Session> {
  const res = await http.post<LoginResponseBackend>('/auth/login', credentials, { auth: false })

  return {
    token: res.accessToken,
    user: {
      id: res.usuario.id,
      email: res.usuario.email,
      name: res.usuario.nombreCompleto,
      // Ante un rol desconocido se asume el menos privilegiado.
      role: ROLES[res.usuario.rol] ?? 'profesional',
      ...(res.usuario.tenantSlug ? { tenantSlug: res.usuario.tenantSlug } : {}),
      ...(res.usuario.tenantNombre ? { tenantNombre: res.usuario.tenantNombre } : {}),
    },
  }
}
