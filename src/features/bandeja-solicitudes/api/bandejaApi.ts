import { http } from '@/shared/api/httpClient'
import { toSolicitud, type Solicitud, type SolicitudBandejaDto } from '@/entities/solicitud'
import type {
  AceptarSolicitudRequest,
  SolicitudAceptada,
  SolicitudAceptadaDto,
} from '../model/types'

// Las rutas van SIN `/api`: ya viene en `VITE_API_URL`. `POST` y no `PATCH`
// como las transiciones de cita: aceptar CREA otro recurso (la cita) y no es
// idempotente; rechazar usa el mismo verbo para que la pareja sea simétrica.

/**
 * POST /solicitudes/:id/aceptar — crea la cita (mismo flujo que `POST /citas`:
 * resuelve o crea el paciente por el RUT de la solicitud) y deja la solicitud
 * `aceptada`, todo en una transacción. 404 si no existe o es de otro tenant;
 * 409 si ya estaba resuelta (NO devuelve la cita anterior).
 */
export async function aceptarSolicitud(
  id: string,
  payload: AceptarSolicitudRequest,
): Promise<SolicitudAceptada> {
  const res = await http.post<SolicitudAceptadaDto>(
    `/solicitudes/${encodeURIComponent(id)}/aceptar`,
    payload,
  )
  return { solicitud: toSolicitud(res.solicitud), cita: res.cita }
}

/**
 * POST /solicitudes/:id/rechazar — sin cuerpo: no se guarda motivo de rechazo
 * (sería más dato sensible retenido, DT-26). No crea cita ni paciente.
 */
export async function rechazarSolicitud(id: string): Promise<Solicitud> {
  const dto = await http.post<SolicitudBandejaDto>(
    `/solicitudes/${encodeURIComponent(id)}/rechazar`,
  )
  return toSolicitud(dto)
}
