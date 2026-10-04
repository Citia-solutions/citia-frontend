// API pública del feature `gestionar-cita` (US-02.08): voucher de la cita con
// las acciones reagendar y cancelar. Desde la Fase 2 (US-03) muestra además el
// estado de los recordatorios y permite editar el contacto del paciente.
export { default as VoucherCita } from './ui/VoucherCita.vue'
export { reagendarCita, cancelarCita, actualizarContactoPaciente } from './api/gestionarCitaApi'
export type {
  CitaActualizada,
  ReagendarCitaRequest,
  CancelarCitaRequest,
  ActualizarContactoRequest,
  PacienteActualizado,
} from './model/types'
