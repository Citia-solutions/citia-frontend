// API pública del slice `recordatorio` (US-03). Desde fuera SIEMPRE se importa
// desde aquí, nunca apuntando a archivos internos (model/, api/, ui/).
export type {
  CanalRecordatorio,
  EstadoRecordatorio,
  MotivoRecordatorio,
  Recordatorio,
} from './model/types'
export {
  ESTADO_RECORDATORIO_LABEL,
  ESTADO_RECORDATORIO_VARIANT,
  MOTIVO_RECORDATORIO_TEXTO,
  describirAntelacion,
  etiquetaEstado,
  lineaDeTiempo,
  textoMotivo,
  varianteEstado,
  type RecordatorioBadgeVariant,
} from './model/presentacion'
export {
  getRecordatoriosDeCita,
  toRecordatorio,
  type RecordatorioCitaDto,
} from './api/recordatorioApi'
export { default as RecordatorioEstadoBadge } from './ui/RecordatorioEstadoBadge.vue'
