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
 * PATCH /citas/:id/reagendar — mueve la cita conservando su id y la devuelve a
 * `pendiente`. 409 si la cita no está en `pendiente` o `confirmada`.
 */
export function reagendarCita(id: string, payload: ReagendarCitaRequest): Promise<CitaActualizada> {
  return http.patch<CitaActualizada>(`/citas/${encodeURIComponent(id)}/reagendar`, payload)
}

/** PATCH /citas/:id/cancelar — terminal: no hay "descancelar". 409 si ya no se puede. */
export function cancelarCita(id: string, payload: CancelarCitaRequest): Promise<CitaActualizada> {
  return http.patch<CitaActualizada>(`/citas/${encodeURIComponent(id)}/cancelar`, payload)
}

/**
 * Ruta de cada transición de estado sin cuerpo (ADR-09 §4). Mismo vocabulario
 * que `accionesPermitidas`: el voucher solo ofrece las que el backend declara.
 */
const RUTA_TRANSICION: Record<TransicionEstado, string> = {
  confirmar: 'confirmar', // pendiente → confirmada
  asistencia: 'asistencia', // confirmada → asistio (terminal)
  inasistencia: 'inasistencia', // confirmada → no_asistio (terminal)
}

/**
 * PATCH /citas/:id/{confirmar | asistencia | inasistencia} — sin cuerpo. 409 si
 * la cita ya no está en el estado de origen (la regla vive en el backend).
 * Responde `CitaResponseDto` sin `accionesPermitidas`: tras cada una se vuelve
 * a pedir el detalle.
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
