import { http } from '@/shared/api/httpClient'
import type { CitaCreada, CrearCitaRequest } from '../model/types'

/**
 * POST /citas — agenda una cita.
 *
 * La ruta va SIN el prefijo `/api`: ya viene en `VITE_API_URL`
 * (`http://localhost:3000/api`), igual que en `authApi`.
 *
 * El backend resuelve el paciente por RUT dentro de la misma transacción: si
 * ese RUT ya existe en la organización, vincula la cita al paciente existente;
 * si no, lo crea. Por eso la respuesta incluye el paciente resultante.
 */
export function crearCita(payload: CrearCitaRequest): Promise<CitaCreada> {
  return http.post<CitaCreada>('/citas', payload)
}
