import { http } from '@/shared/api/httpClient'
import type {
  ActualizarContactoRequest,
  CancelarCitaRequest,
  CitaActualizada,
  PacienteActualizado,
  ReagendarCitaRequest,
  TransicionEstado,
} from '../model/types'

// Las rutas van SIN `/api`: ya viene en `VITE_API_URL`.

/**
 * PATCH /citas/:id/reagendar — `{ inicio, motivo?, pedidoPor }`. Mueve la cita
 * conservando su id y la devuelve a `pendiente`. 409 si la cita no está en
 * `pendiente` o `confirmada`. `pedidoPor` (US-07.01) queda en la bitácora.
 */
export function reagendarCita(id: string, payload: ReagendarCitaRequest): Promise<CitaActualizada> {
  return http.patch<CitaActualizada>(`/citas/${encodeURIComponent(id)}/reagendar`, payload)
}

/**
 * PATCH /citas/:id/cancelar — `{ motivo?, pedidoPor }`. Terminal: no hay
 * "descancelar". 409 si ya no se puede. `pedidoPor` (US-07.01) queda en la
 * bitácora.
 */
export function cancelarCita(id: string, payload: CancelarCitaRequest): Promise<CitaActualizada> {
  return http.patch<CitaActualizada>(`/citas/${encodeURIComponent(id)}/cancelar`, payload)
}

/**
 * Ruta de cada transición de estado sin cuerpo (ADR-09 §4). Mismo vocabulario
 * que `accionesPermitidas`: el voucher solo ofrece las que el backend declara.
 * Desde US-07.01, `asistencia` e `inasistencia` también salen de una pendiente
 * y el backend exige la hora de inicio (409 antes).
 */
const RUTA_TRANSICION: Record<TransicionEstado, string> = {
  confirmar: 'confirmar', // pendiente → confirmada
  asistencia: 'asistencia', // pendiente | confirmada → asistio (terminal)
  inasistencia: 'inasistencia', // confirmada → no_asistio · pendiente → ghosting (terminales)
}

/**
 * PATCH /citas/:id/{confirmar | asistencia | inasistencia} — sin cuerpo. 409 si
 * la cita ya no está en el estado de origen o, en `asistencia` e
 * `inasistencia`, si todavía no llega su hora de inicio (las reglas viven en el
 * backend). Responde `CitaResponseDto` sin `accionesPermitidas` y con el
 * `estado` real de destino: tras cada una se vuelve a pedir el detalle.
 */
export function cambiarEstadoCita(id: string, transicion: TransicionEstado): Promise<CitaActualizada> {
  return http.patch<CitaActualizada>(
    `/citas/${encodeURIComponent(id)}/${RUTA_TRANSICION[transicion]}`,
  )
}

/**
 * PATCH /pacientes/:id — completa o corrige el teléfono y/o el correo del
 * paciente (Fase 2, ADR-13 §14). Al menos un campo; el backend normaliza el
 * correo (trim + minúsculas). 404 si es de otra organización o no existe.
 *
 * Vive en este feature porque el único lugar del front donde se edita el
 * contacto es el voucher (no hay ficha de paciente todavía).
 */
export function actualizarContactoPaciente(
  pacienteId: string,
  payload: ActualizarContactoRequest,
): Promise<PacienteActualizado> {
  return http.patch<PacienteActualizado>(`/pacientes/${encodeURIComponent(pacienteId)}`, payload)
}

/**
 * POST /citas/:id/enlace/invalidar — Fase 3. Revoca el enlace de la cita que va
 * en los recordatorios (`/cita#<token>`): el de los correos ya enviados deja de
 * servir y, si quedan recordatorios por salir, llevarán uno nuevo. 204 sin
 * cuerpo; idempotente (sin enlace activo también es 204). 404 si la cita no es
 * de la organización.
 */
export async function invalidarEnlacePaciente(citaId: string): Promise<void> {
  await http.post<unknown>(`/citas/${encodeURIComponent(citaId)}/enlace/invalidar`)
}
