import { http } from '@/shared/api/httpClient'
import type {
  CancelarHoraRequest,
  PedirOtraHoraRequest,
  VistaCitaPacienteDto,
} from '../model/types'

// Rutas públicas del portal del paciente (Fase 3). Van SIN `/api`: ya viene en
// `VITE_API_URL`.
//
// Reglas que no se rompen (decisión S3 del contrato):
// - **El token es la credencial** y viaja SOLO en la cabecera `X-Enlace-Cita`:
//   nunca en la URL de la API (ni path ni query), que quedaría en logs.
// - **`auth: false`**: la sesión del profesional, si el mismo navegador la
//   tiene, no debe viajar a una ruta anónima (y un 401 no la cerraría).
// - **Sin referrer** ni caché del navegador: la respuesta trae datos de la cita.
// - **Ninguna acción es un GET**: abrir la página solo lee. Confirmar, cancelar
//   y pedir otra hora son POST que se disparan tras un clic.

const CABECERA_ENLACE = 'X-Enlace-Cita'

/** Opciones comunes de las cuatro llamadas (se pasan tal cual a `httpClient`). */
function opciones(token: string): Omit<RequestInit, 'body'> & { auth: false } {
  return {
    auth: false,
    headers: { [CABECERA_ENLACE]: token },
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
  }
}

/**
 * GET /publico/cita — la hora del paciente y lo que puede hacer con ella.
 * Todo enlace no válido (formato, inexistente, invalidado, cita terminal o ya
 * pasada) responde el mismo 404.
 */
export function obtenerVistaCita(token: string): Promise<VistaCitaPacienteDto> {
  return http.get<VistaCitaPacienteDto>('/publico/cita', opciones(token))
}

/** POST /publico/cita/confirmar — sin cuerpo. 200 con la vista; 409 si ya no se puede. */
export function confirmarHora(token: string): Promise<VistaCitaPacienteDto> {
  return http.post<VistaCitaPacienteDto>('/publico/cita/confirmar', undefined, opciones(token))
}

/** POST /publico/cita/cancelar — `{ motivo? }`. 200 con la vista ya `cancelada` y sin acciones. */
export function cancelarHora(
  token: string,
  payload: CancelarHoraRequest,
): Promise<VistaCitaPacienteDto> {
  return http.post<VistaCitaPacienteDto>('/publico/cita/cancelar', payload, opciones(token))
}

/**
 * POST /publico/cita/otra-hora — `{ preferencia, motivo? }`. 201 con la vista
 * (ya con `solicitudOtraHora`). No mueve la cita: crea una solicitud en la
 * bandeja del profesional.
 */
export function pedirOtraHora(
  token: string,
  payload: PedirOtraHoraRequest,
): Promise<VistaCitaPacienteDto> {
  return http.post<VistaCitaPacienteDto>('/publico/cita/otra-hora', payload, opciones(token))
}
