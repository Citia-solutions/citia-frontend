// API pública del slice `solicitud`. Desde fuera SIEMPRE se importa desde aquí,
// nunca apuntando a archivos internos (model/, api/).
export type { EstadoSolicitud, Solicitud } from './model/types'
export { useSolicitudesRecibidas } from './model/useSolicitudesRecibidas'
export {
  getSolicitudes,
  toSolicitud,
  TOPE_BANDEJA,
  type SolicitudBandejaDto,
} from './api/solicitudApi'
