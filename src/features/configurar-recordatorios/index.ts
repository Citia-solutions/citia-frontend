// API pública del feature `configurar-recordatorios` (US-03, Fase 2): la
// configuración de recordatorios por correo del profesional logueado.
export { default as ConfiguracionRecordatorios } from './ui/ConfiguracionRecordatorios.vue'
export { useConfiguracionRecordatorios } from './model/useConfiguracionRecordatorios'
export {
  getConfiguracionRecordatorios,
  guardarConfiguracionRecordatorios,
} from './api/configuracionRecordatoriosApi'
export {
  ANTELACIONES_SUGERIDAS,
  HORAS_SIN_ENVIO,
  LIMITES_CONFIGURACION,
} from './model/configuracionSchema'
export type {
  ConfiguracionRecordatoriosDto,
  GuardarConfiguracionRequest,
  ConfiguracionForm,
} from './model/types'
