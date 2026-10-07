import { http } from '@/shared/api/httpClient'
import type { EstadoSolicitud, Solicitud } from '../model/types'

// ---------------------------------------------------------------------------
// Contrato del backend (formas tal como viajan)
// ---------------------------------------------------------------------------

/** Elemento de `GET /solicitudes` y de las respuestas de aceptar/rechazar (`SolicitudBandejaDto`). */
export interface SolicitudBandejaDto {
  id: string
  estado: EstadoSolicitud
  rut: string
  nombrePaciente: string
  telefono: string
  correo: string | null
  motivo: string
  preferenciaHoraria: string
  consentimiento: boolean
  recibidaEn: string
  /** Nuevo en el cierre de Fase 1 (migración); se tolera ausente. */
  resueltaEn?: string | null
  citaId: string | null
}

/**
 * Tope fijo de `GET /solicitudes` en la v1 (sin paginación). Espejo del
 * backend: si la bandeja devuelve exactamente esto, puede haber más.
 */
export const TOPE_BANDEJA = 100

// ---------------------------------------------------------------------------
// Traducción DTO → modelo. Hoy casi identidad; si el backend renombra un
// campo, se toca solo aquí.
// ---------------------------------------------------------------------------

export function toSolicitud(dto: SolicitudBandejaDto): Solicitud {
  return {
    id: dto.id,
    estado: dto.estado,
    rut: dto.rut,
    nombrePaciente: dto.nombrePaciente,
    telefono: dto.telefono,
    correo: dto.correo ?? null,
    motivo: dto.motivo,
    preferenciaHoraria: dto.preferenciaHoraria,
    consentimiento: dto.consentimiento,
    recibidaEn: dto.recibidaEn,
    resueltaEn: dto.resueltaEn ?? null,
    citaId: dto.citaId ?? null,
  }
}

// ---------------------------------------------------------------------------
// Llamadas. Las rutas van SIN `/api`: ya viene en `VITE_API_URL`.
// ---------------------------------------------------------------------------

/**
 * GET /solicitudes?estado= — bandeja de la ORGANIZACIÓN (cualquier profesional
 * del tenant ve y resuelve). Orden del backend: `recibida` por `recibidaEn`
 * ascendente (la que más espera, primero); `aceptada`/`rechazada` por
 * `resueltaEn` descendente. El front no reordena. Máximo `TOPE_BANDEJA`.
 */
export async function getSolicitudes(estado: EstadoSolicitud): Promise<Solicitud[]> {
  const query = new URLSearchParams({ estado })
  const dtos = await http.get<SolicitudBandejaDto[]>(`/solicitudes?${query.toString()}`)
  return dtos.map(toSolicitud)
}
