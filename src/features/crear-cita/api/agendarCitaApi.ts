import { http } from '@/shared/api/httpClient'
import type { SolicitudRecibida, SolicitudRequest } from '../model/toSolicitudRequest'

/**
 * POST /publico/:tenantSlug/solicitudes — envía la solicitud de hora.
 *
 * Ruta **pública**: no lleva token, la rellena un paciente sin cuenta. Por eso
 * `auth: false` — si el profesional abre su propio enlace en el mismo navegador,
 * su sesión no debe viajar a una ruta anónima. La organización va en la URL
 * porque el enlace es lo que identifica a quién se le está pidiendo hora.
 *
 * El backend responde **siempre 202 con el mismo mensaje**, exista o no la
 * organización y haya o no una solicitud abierta con ese RUT. Es deliberado: si
 * la respuesta variara se podría averiguar qué organizaciones existen y qué RUT
 * es paciente de qué profesional. Consecuencia para el front: un 202 significa
 * "recibido para revisión", no "guardado con certeza".
 */
export function enviarSolicitud(
  tenantSlug: string,
  payload: SolicitudRequest,
): Promise<SolicitudRecibida> {
  return http.post<SolicitudRecibida>(
    `/publico/${encodeURIComponent(tenantSlug)}/solicitudes`,
    payload,
    { auth: false },
  )
}
