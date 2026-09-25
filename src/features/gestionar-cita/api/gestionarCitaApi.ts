import { http } from '@/shared/api/httpClient'
import type { CancelarCitaRequest, CitaActualizada, ReagendarCitaRequest } from '../model/types'

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
