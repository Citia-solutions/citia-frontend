import { http } from '@/shared/api/httpClient'
import type { CrearMensajeSoporteRequest, MensajeSoporteCreado } from '../model/types'

/** Forma cruda de `MensajeSoporteCreadoDto`: `creadoEn` llega como texto ISO. */
interface MensajeSoporteCreadoDto {
  id: string
  creadoEn: string
}

/**
 * POST /soporte/mensajes — guarda el mensaje; el correo a soporte sale después,
 * por un job del backend. Con el Bearer por defecto. 400 si el texto no
 * cumple; 429 por el tope de la organización (5 en 24 horas, con su propio
 * texto) o por el límite de tasa por IP.
 */
export async function enviarMensajeSoporte(
  payload: CrearMensajeSoporteRequest,
): Promise<MensajeSoporteCreado> {
  const dto = await http.post<MensajeSoporteCreadoDto>('/soporte/mensajes', payload)
  const creadoEn = dto.creadoEn ? new Date(dto.creadoEn) : null
  return {
    id: dto.id,
    creadoEn: creadoEn && !Number.isNaN(creadoEn.getTime()) ? creadoEn : null,
  }
}
