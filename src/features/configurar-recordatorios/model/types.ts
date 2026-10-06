// Tipos del feature `configurar-recordatorios` (US-03): la configuración de
// recordatorios del profesional logueado. Es SIEMPRE la del usuario del token:
// ni `tenantId` ni `usuarioId` viajan.

// ---------------------------------------------------------------------------
// Contrato del backend
// ---------------------------------------------------------------------------

/**
 * Respuesta de `GET` y `PUT /recordatorios/configuracion`. Desde el lote 2 de
 * la limpieza previa al release (2026-10-05) vive en `entities/recordatorio`,
 * porque también la lee el dashboard; aquí se reexporta para no tocar a quien
 * la importaba desde este feature.
 */
export type { ConfiguracionRecordatoriosDto } from '@/entities/recordatorio'

/**
 * Cuerpo de `PUT /recordatorios/configuracion`. **Reemplazo completo:** lo que
 * no viaja queda vacío, por eso el front manda siempre los cuatro campos
 * (vacío = `null`).
 */
export interface GuardarConfiguracionRequest {
  activo: boolean
  antelacionesMin: number[]
  telefonoContacto: string | null
  correoRespuesta: string | null
}

// ---------------------------------------------------------------------------
// Formulario
// ---------------------------------------------------------------------------

export interface ConfiguracionForm {
  activo: boolean
  /** Siempre de mayor a menor y sin repetidos. */
  antelacionesMin: number[]
  telefonoContacto: string
  correoRespuesta: string
}

export type ConfiguracionField = keyof ConfiguracionForm
export type ConfiguracionErrors = Partial<Record<ConfiguracionField, string>>
