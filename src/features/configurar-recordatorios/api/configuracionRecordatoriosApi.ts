import { http } from '@/shared/api/httpClient'
import type { ConfiguracionRecordatoriosDto, GuardarConfiguracionRequest } from '../model/types'

// Las rutas van SIN `/api`: ya viene en `VITE_API_URL`.

/**
 * GET /recordatorios/configuracion — vive en `entities/recordatorio` (la lee
 * también la tarjeta "Recordatorios" del dashboard). Se reexporta para que
 * este feature siga teniendo su API completa en un solo lugar.
 */
export { getConfiguracionRecordatorios } from '@/entities/recordatorio'

/**
 * PUT /recordatorios/configuracion — la reemplaza completa y devuelve la
 * guardada (`predeterminada: false`). 400 si no cumple las reglas.
 *
 * El backend reprograma (o anula, si se desactivó) los recordatorios de las
 * citas futuras del profesional de forma asíncrona: tarda unos segundos.
 */
export function guardarConfiguracionRecordatorios(
  payload: GuardarConfiguracionRequest,
): Promise<ConfiguracionRecordatoriosDto> {
  return http.put<ConfiguracionRecordatoriosDto>('/recordatorios/configuracion', payload)
}
