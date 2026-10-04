// Tipos de la entidad `recordatorio`: el correo automático que recibe el
// paciente antes de su cita (US-03, ADR-13 del backend). Una cita tiene de 0 a
// 3 recordatorios, uno por "momento" (antelación) configurado por el profesional.
//
// Igual que `solicitud`, este slice nombra en español: es el vocabulario del
// backend y del contrato (`estado`, `motivo`, `antelacionMin`).

/** Canal del recordatorio. En la Fase 2 solo existe el correo. */
export type CanalRecordatorio = 'email'

/**
 * Los seis estados de ADR-13 §4.
 *
 * - `programado`: espera su hora.
 * - `enviado` → `entregado`: el proveedor lo aceptó y luego confirmó la entrega.
 * - `cancelado`: dejó de tener sentido (la cita cambió). No es un fallo.
 * - `omitido`: una regla decidió no enviarlo (p. ej. sin correo). No es un fallo del servicio.
 * - `fallido`: se intentó y no llegó.
 */
export type EstadoRecordatorio =
  | 'programado'
  | 'enviado'
  | 'entregado'
  | 'fallido'
  | 'cancelado'
  | 'omitido'

/** Por qué un recordatorio no salió. Solo en `cancelado`, `omitido` y `fallido`. */
export type MotivoRecordatorio =
  // cancelado
  | 'cita_terminal'
  | 'reprogramado'
  | 'desactivado'
  // omitido
  | 'creada_tarde'
  | 'fusionado'
  | 'sin_correo'
  | 'correo_suprimido'
  | 'limite_tenant'
  | 'sin_consentimiento'
  // fallido
  | 'correo_invalido'
  | 'rechazado'
  | 'vencido'
  | 'cuota_agotada'
  | 'rebote'

/** Un recordatorio de una cita tal como lo ve el profesional. */
export interface Recordatorio {
  id: string
  canal: CanalRecordatorio
  /** Minutos antes del inicio de la cita: 1440 = 24 h antes, 120 = 2 h antes. */
  antelacionMin: number
  estado: EstadoRecordatorio
  /** Código del motivo cuando no salió; null en `programado`, `enviado` y `entregado`. */
  motivo: MotivoRecordatorio | null
  /** Instante ISO planificado (inicio − antelación, adelantado si caía en horas sin envío). */
  programadoPara: string
  /**
   * Instante ISO en que se intentará de verdad, solo mientras está `programado`.
   * Difiere de `programadoPara` en un tardío, un reintento o una espera.
   */
  proximoIntentoEn: string | null
  enviadoEn: string | null
  entregadoEn: string | null
}
