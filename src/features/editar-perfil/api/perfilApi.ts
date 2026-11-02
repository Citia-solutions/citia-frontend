import { http } from '@/shared/api/httpClient'
import type { ActualizarPerfilRequest, Perfil } from '../model/types'

// Las rutas van SIN `/api`: ya viene en `VITE_API_URL`. Las dos exigen sesión
// (Bearer por defecto): un 401 lo atiende el handler global.

/**
 * Forma cruda de `PerfilDto` del backend (`GET` y `PATCH /usuarios/me`). La
 * traducción vive aquí, como en `features/auth/api/authApi.ts`: hacia adentro
 * del feature solo circula `Perfil`.
 */
interface PerfilDto {
  id: string
  email: string
  nombreCompleto: string
  especialidad: string | null
  rol: string
  tenantId: string
  tenantSlug: string
  tenantNombre: string
  creadoEn: string
}

function aPerfil(dto: PerfilDto): Perfil {
  return {
    id: dto.id,
    email: dto.email,
    nombreCompleto: dto.nombreCompleto,
    especialidad: dto.especialidad ?? null,
    tenantSlug: dto.tenantSlug,
    tenantNombre: dto.tenantNombre,
  }
}

/** GET /usuarios/me — el perfil del usuario del token. */
export async function getPerfil(): Promise<Perfil> {
  return aPerfil(await http.get<PerfilDto>('/usuarios/me'))
}

/**
 * PATCH /usuarios/me — cambia el nombre y/o la especialidad y devuelve el
 * perfil actualizado. 400 si no cumplen las reglas (lista en inglés del
 * `ValidationPipe` o texto en español del dominio).
 */
export async function actualizarPerfil(payload: ActualizarPerfilRequest): Promise<Perfil> {
  return aPerfil(await http.patch<PerfilDto>('/usuarios/me', payload))
}
