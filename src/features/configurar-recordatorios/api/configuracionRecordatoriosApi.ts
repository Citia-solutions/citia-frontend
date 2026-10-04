import { http } from '@/shared/api/httpClient'
import type { ConfiguracionRecordatoriosDto, GuardarConfiguracionRequest } from '../model/types'

// Las rutas van SIN `/api`: ya viene en `VITE_API_URL`.

/**
 * GET /recordatorios/configuracion — la configuración del profesional del
 * token, o la predeterminada (`predeterminada: true`) si nunca guardó una.
 */
export function getConfiguracionRecordatorios(): Promise<ConfiguracionRecordatoriosDto> {
  return http.get<ConfiguracionRecordatoriosDto>('/recordatorios/configuracion')
}

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
