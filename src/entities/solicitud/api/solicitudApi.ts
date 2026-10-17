import { http } from '@/shared/api/httpClient'
import type {
  CitaOrigen,
  EstadoSolicitud,
  Solicitud,
  TipoSolicitud,
} from '../model/types'

// ---------------------------------------------------------------------------
// Contrato del backend (formas tal como viajan)
// ---------------------------------------------------------------------------

/** Elemento de `GET /solicitudes` y de las respuestas de aceptar/rechazar (`SolicitudBandejaDto`). */
export interface SolicitudBandejaDto {
  id: string
  estado: EstadoSolicitud
  /** Fase 3: null si el paciente de una solicitud de otra hora no tiene RUT (la bandeja dice "Sin RUT"). */
  rut: string | null
  nombrePaciente: string
  telefono: string
  /** null si el paciente no tiene correo (la bandeja dice "Sin correo"). */
  correo: string | null
  /**
   * Fase 3: el motivo es opcional al pedir otra hora; sin motivo llega `''`.
   * Se tolera también null. En el modelo queda `''` = "sin motivo" (no se muestra).
   */
  motivo: string | null
  preferenciaHoraria: string
  consentimiento: boolean
  recibidaEn: string
  /** Nuevo en el cierre de Fase 1 (migración); se tolera ausente. */
  resueltaEn?: string | null
  citaId: string | null
  /** Fase 3 (aditivo): se tolera ausente → `nueva`. */
  tipo?: TipoSolicitud
  /** Fase 3: cita sobre la que se pide otra hora; null en una `nueva`. */
  citaOrigenId?: string | null
  /** Fase 3: `{ inicio, duracionMin, estado }` de la cita de origen, o null. */
  citaOrigen?: CitaOrigen | null
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
    tipo: dto.tipo ?? 'nueva',
    rut: dto.rut ?? null,
    nombrePaciente: dto.nombrePaciente,
    telefono: dto.telefono,
    correo: dto.correo ?? null,
    motivo: dto.motivo ?? '',
    preferenciaHoraria: dto.preferenciaHoraria,
    consentimiento: dto.consentimiento,
    recibidaEn: dto.recibidaEn,
    resueltaEn: dto.resueltaEn ?? null,
    citaId: dto.citaId ?? null,
    citaOrigenId: dto.citaOrigenId ?? null,
    citaOrigen: dto.citaOrigen ?? null,
  }
}

// ---------------------------------------------------------------------------
// Llamadas. Las rutas van SIN `/api`: ya viene en `VITE_API_URL`.
// ---------------------------------------------------------------------------

/** Filtros extra de `GET /solicitudes` además del estado. */
export interface FiltrosSolicitudes {
  /** Fase 3: solo las de otra hora de esa cita. */
  citaOrigenId?: string
}

/**
 * GET /solicitudes?estado=[&citaOrigenId=] — bandeja de la ORGANIZACIÓN
 * (cualquier profesional del tenant ve y resuelve). Orden del backend:
 * `recibida` por `recibidaEn` ascendente (la que más espera, primero); las
 * resueltas por `resueltaEn` descendente. El front no reordena. Máximo
 * `TOPE_BANDEJA`.
 */
export async function getSolicitudes(
  estado: EstadoSolicitud,
  filtros: FiltrosSolicitudes = {},
): Promise<Solicitud[]> {
  const query = new URLSearchParams({ estado })
  if (filtros.citaOrigenId) query.set('citaOrigenId', filtros.citaOrigenId)
  const dtos = await http.get<SolicitudBandejaDto[]>(`/solicitudes?${query.toString()}`)
  return dtos.map(toSolicitud)
}

/**
 * La solicitud de otra hora que el paciente dejó abierta para esa cita, o null
 * (Fase 3: a lo más una `recibida` por cita). La pide el voucher.
 *
 * Filtra también en el front por `tipo` y `citaOrigenId`: si el backend no
 * aplicara el filtro (anterior a la Fase 3), la lista traería TODAS las
 * recibidas y el voucher atribuiría a esta cita la de otro paciente.
 */
export async function getSolicitudOtraHoraAbierta(citaId: string): Promise<Solicitud | null> {
  const lista = await getSolicitudes('recibida', { citaOrigenId: citaId })
  return lista.find((s) => s.tipo === 'reagendamiento' && s.citaOrigenId === citaId) ?? null
}
