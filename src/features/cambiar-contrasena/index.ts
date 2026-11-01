// API pública del feature `cambiar-contrasena` (US-10, Fase 7): la pestaña
// "Seguridad" de Mi Perfil (`PUT /usuarios/me/contrasena`).
export { default as CambiarContrasenaForm } from './ui/CambiarContrasenaForm.vue'
export {
  useCambiarContrasena,
  CONTRASENA_CAMBIADA,
  CAMBIO_EN_PARALELO,
} from './model/useCambiarContrasena'
export { cambiarContrasena } from './api/contrasenaApi'
export { CONTRASENA_MIN_CARACTERES, CONTRASENA_MAX_BYTES } from './model/contrasenaSchema'
export type { CambiarContrasenaRequest, ContrasenaCambiada } from './model/types'
