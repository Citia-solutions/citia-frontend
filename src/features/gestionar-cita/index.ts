// API pública del feature `gestionar-cita` (US-02.08): voucher de la cita con
// las acciones reagendar y cancelar. Desde la Fase 2 (US-03) muestra además el
// estado de los recordatorios y permite editar el contacto del paciente. Desde
// el lote 2 de la limpieza previa al release (2026-10-05), confirmar y
// registrar asistencia / inasistencia.
export { default as VoucherCita } from './ui/VoucherCita.vue'
export {
  reagendarCita,
  cancelarCita,
  cambiarEstadoCita,
  actualizarContactoPaciente,
} from './api/gestionarCitaApi'
export type {
  CitaActualizada,
  ReagendarCitaRequest,
  CancelarCitaRequest,
  TransicionEstado,
  ActualizarContactoRequest,
  PacienteActualizado,
} from './model/types'
