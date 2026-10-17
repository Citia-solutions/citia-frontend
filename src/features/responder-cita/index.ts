// API pública del feature `responder-cita` (Fase 3 — US-04 + US-02.07): la
// página del paciente `/cita#<token>`, donde confirma, cancela o pide otra hora
// desde el enlace de su recordatorio, sin cuenta. Lo usa `pages/cita-paciente`.
//
// No reutiliza `gestionar-cita` (el voucher del profesional): mismo verbo, otro
// actor, otras rutas y otras reglas. Mezclarlos invitaría a que un día el
// paciente llame por error a una ruta del profesional.
export { default as RespuestaCita } from './ui/RespuestaCita.vue'
export { tokenDesdeFragmento } from './model/tokenEnlace'
export { useRespuestaCita } from './model/useRespuestaCita'
export {
  obtenerVistaCita,
  confirmarHora,
  cancelarHora,
  pedirOtraHora,
} from './api/respuestaCitaApi'
export type {
  AccionPaciente,
  VistaCitaPacienteDto,
  SolicitudOtraHoraDto,
  CancelarHoraRequest,
  PedirOtraHoraRequest,
} from './model/types'
