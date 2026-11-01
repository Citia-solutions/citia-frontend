// API pública del feature `contactar-soporte` (US-10, Fase 7): el modal
// "Contactar soporte" (`POST /soporte/mensajes`). Lo montan `pages/perfil` y
// `app/layouts/PanelSidebar.vue` (F2).
export { default as ContactarSoporteModal } from './ui/ContactarSoporteModal.vue'
export { useContactarSoporte } from './model/useContactarSoporte'
export { enviarMensajeSoporte } from './api/soporteApi'
export {
  AVISO_DATOS_PACIENTES,
  CATEGORIAS,
  MENSAJE_MAX,
  MENSAJE_RECIBIDO,
} from './model/soporteSchema'
export type {
  CategoriaSoporte,
  CrearMensajeSoporteRequest,
  MensajeSoporteCreado,
} from './model/types'
