import { http } from '@/shared/api/httpClient'
import type { Suscripcion } from '../model/types'

/** Forma cruda de `SuscripcionDto` del backend: las fechas llegan como texto ISO. */
interface SuscripcionDto {
  plan: string
  planNombre: string
  descripcion: string | null
  altaEn: string
  renovacionEn: string | null
  metodoPago: string | null
}

/** Texto ISO → `Date`; `null` si falta o no se puede leer. */
function aFecha(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

/**
 * GET /organizacion/suscripcion — solo el `ADMINISTRADOR` de la organización
 * (403 para un `PROFESIONAL`). La ruta va sin `/api` (ya viene en
 * `VITE_API_URL`) y con el Bearer por defecto.
 */
export async function getSuscripcion(): Promise<Suscripcion> {
  const dto = await http.get<SuscripcionDto>('/organizacion/suscripcion')
  return {
    plan: dto.plan,
    planNombre: dto.planNombre,
    descripcion: dto.descripcion ?? null,
    altaEn: aFecha(dto.altaEn),
    renovacionEn: aFecha(dto.renovacionEn),
    metodoPago: dto.metodoPago ?? null,
  }
}
