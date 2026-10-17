// API pública del slice `solicitud`. Desde fuera SIEMPRE se importa desde aquí,
// nunca apuntando a archivos internos (model/, api/).
export type {
  EstadoSolicitud,
  TipoSolicitud,
  EstadoCitaOrigen,
  CitaOrigen,
  Solicitud,
} from './model/types'
export { useSolicitudesRecibidas } from './model/useSolicitudesRecibidas'
export {
  getSolicitudes,
  getSolicitudOtraHoraAbierta,
  toSolicitud,
  TOPE_BANDEJA,
  type FiltrosSolicitudes,
  type SolicitudBandejaDto,
} from './api/solicitudApi'
