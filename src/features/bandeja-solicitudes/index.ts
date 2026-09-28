// API pública del feature `bandeja-solicitudes` (cierre de Fase 1 de US-02):
// listar, aceptar y rechazar las solicitudes que llegan por el enlace público.
export { default as BandejaSolicitudes } from './ui/BandejaSolicitudes.vue'
export { aceptarSolicitud, rechazarSolicitud } from './api/bandejaApi'
export { sugerirInicio } from './model/useAceptarSolicitud'
export type {
  AceptarSolicitudRequest,
  SolicitudAceptada,
  CitaDeSolicitud,
} from './model/types'
