import { http } from '@/shared/api/httpClient'
import type {
  CanalRecordatorio,
  EstadoRecordatorio,
  MotivoRecordatorio,
  Recordatorio,
} from '../model/types'

// ---------------------------------------------------------------------------
// Contrato del backend (formas tal como viajan)
// ---------------------------------------------------------------------------

/**
 * Elemento de `GET /citas/:citaId/recordatorios` (`RecordatorioCitaDto`). Sin
 * destinatario, proveedor, intentos ni errores internos: a propósito (ADR-13 §17).
 */
export interface RecordatorioCitaDto {
  id: string
  canal: CanalRecordatorio
  antelacionMin: number
  estado: EstadoRecordatorio
  motivo: MotivoRecordatorio | null
  /** Instantes ISO (UTC). */
  programadoPara: string
  proximoIntentoEn: string | null
  enviadoEn: string | null
  entregadoEn: string | null
}

/**
 * Respuesta de `GET` y `PUT /recordatorios/configuracion`
 * (`ConfiguracionRecordatoriosDto`). Vive en la entidad (y no en el feature
 * `configurar-recordatorios`) porque la leen dos features: la pantalla de
 * configuración y la tarjeta "Recordatorios" del dashboard.
 */
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

// ---------------------------------------------------------------------------
// Traducción DTO → modelo. Hoy casi identidad; si el backend renombra un
// campo, se toca solo aquí.
// ---------------------------------------------------------------------------

export function toRecordatorio(dto: RecordatorioCitaDto): Recordatorio {
  return {
    id: dto.id,
    canal: dto.canal,
    antelacionMin: dto.antelacionMin,
    estado: dto.estado,
    motivo: dto.motivo ?? null,
    programadoPara: dto.programadoPara,
    proximoIntentoEn: dto.proximoIntentoEn ?? null,
    enviadoEn: dto.enviadoEn ?? null,
    entregadoEn: dto.entregadoEn ?? null,
  }
}

// ---------------------------------------------------------------------------
// Llamadas. Las rutas van SIN `/api`: ya viene en `VITE_API_URL`.
// ---------------------------------------------------------------------------

/**
 * GET /citas/:citaId/recordatorios — todos los recordatorios de la cita
 * (incluidos los cancelados), ordenados por `programadoPara`; el front no
 * reordena. 404 si la cita no existe o es de otra organización.
 *
 * Justo después de crear o reagendar la cita la lista puede venir vacía o
 * desactualizada: el backend los programa al procesar el evento (~5 s).
 */
export async function getRecordatoriosDeCita(citaId: string): Promise<Recordatorio[]> {
  const dtos = await http.get<RecordatorioCitaDto[]>(
    `/citas/${encodeURIComponent(citaId)}/recordatorios`,
  )
  return dtos.map(toRecordatorio)
}

/**
 * GET /recordatorios/configuracion — la configuración del profesional del
 * token, o la predeterminada (`predeterminada: true`) si nunca guardó una. No
 * viaja `tenantId` ni `usuarioId`.
 */
export function getConfiguracionRecordatorios(): Promise<ConfiguracionRecordatoriosDto> {
  return http.get<ConfiguracionRecordatoriosDto>('/recordatorios/configuracion')
}
