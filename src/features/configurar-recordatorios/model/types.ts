// Tipos del feature `configurar-recordatorios` (US-03): la configuración de
// recordatorios del profesional logueado. Es SIEMPRE la del usuario del token:
// ni `tenantId` ni `usuarioId` viajan.
import type { CanalRecordatorio } from '@/entities/recordatorio'

// ---------------------------------------------------------------------------
// Contrato del backend
// ---------------------------------------------------------------------------

/** Respuesta de `GET` y `PUT /recordatorios/configuracion` (`ConfiguracionRecordatoriosDto`). */
export interface ConfiguracionRecordatoriosDto {
  activo: boolean
  canal: CanalRecordatorio
  /** Minutos antes del inicio, de mayor a menor (p. ej. `[1440, 120]`). */
  antelacionesMin: number[]
  telefonoContacto: string | null
  /** `Reply-To`; null = el correo dice que no recibe respuestas. */
  correoRespuesta: string | null
  /** true mientras el profesional nunca guardó una: se aplica la del entorno (24 h y 2 h, activa). */
  predeterminada: boolean
}

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
