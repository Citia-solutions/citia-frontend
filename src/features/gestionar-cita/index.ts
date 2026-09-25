// API pública del feature `gestionar-cita` (US-02.08): voucher de la cita con
// las acciones reagendar y cancelar.
export { default as VoucherCita } from './ui/VoucherCita.vue'
export { reagendarCita, cancelarCita } from './api/gestionarCitaApi'
export type {
  CitaActualizada,
  ReagendarCitaRequest,
  CancelarCitaRequest,
} from './model/types'
