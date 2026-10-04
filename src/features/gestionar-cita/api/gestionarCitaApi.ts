import { http } from '@/shared/api/httpClient'
import type {
  ActualizarContactoRequest,
  CancelarCitaRequest,
  CitaActualizada,
  PacienteActualizado,
  ReagendarCitaRequest,
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
