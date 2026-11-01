// API pública del feature `editar-perfil` (US-10, Fase 7): la pestaña
// "Información personal" de Mi Perfil (`GET` y `PATCH /usuarios/me`).
export { default as InformacionPersonal } from './ui/InformacionPersonal.vue'
export { useEditarPerfil } from './model/useEditarPerfil'
export { getPerfil, actualizarPerfil } from './api/perfilApi'
export { NOMBRE_MAX, ESPECIALIDAD_MAX } from './model/perfilSchema'
export type { Perfil, ActualizarPerfilRequest, PerfilForm } from './model/types'
