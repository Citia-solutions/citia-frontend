import { http } from '@/shared/api/httpClient'
import type { NuevaCitaForm } from '../model/types'

export interface CrearCitaResponse {
  id: string
}

/** POST /api/citas — crea una nueva cita. */
export function crearCita(payload: NuevaCitaForm): Promise<CrearCitaResponse> {
  return http.post<CrearCitaResponse>('/api/citas', payload)
}
