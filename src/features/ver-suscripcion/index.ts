// API pública del feature `ver-suscripcion` (US-10, Fase 7): la pestaña
// "Suscripción" de Mi Perfil, solo para el administrador
// (`GET /organizacion/suscripcion`).
export { default as SuscripcionOrganizacion } from './ui/SuscripcionOrganizacion.vue'
export { useSuscripcion, SOLO_ADMINISTRADOR } from './model/useSuscripcion'
export { getSuscripcion } from './api/suscripcionApi'
export type { Suscripcion } from './model/types'
