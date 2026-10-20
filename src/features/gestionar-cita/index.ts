// API pública del feature `gestionar-cita` (US-02.08): voucher de la cita con
// las acciones reagendar y cancelar. Desde la Fase 2 (US-03) muestra además el
// estado de los recordatorios y permite editar el contacto del paciente. Desde
// el lote 2 de la limpieza previa al release (2026-10-05), confirmar y
// registrar asistencia / inasistencia. Desde la Fase 3 (US-04 + US-02.07),
// quién confirmó / canceló, la nota "El paciente pidió otra hora" e invalidar
// el enlace del paciente. Desde US-07.01 (Fase 5), Asistió / No asistió sobre
// una pendiente que ya empezó y "¿Quién lo pidió?" al cancelar y reagendar.
export { default as VoucherCita } from './ui/VoucherCita.vue'
export {
  reagendarCita,
  cancelarCita,
  cambiarEstadoCita,
  actualizarContactoPaciente,
  invalidarEnlacePaciente,
} from './api/gestionarCitaApi'
export type {
  CitaActualizada,
  ReagendarCitaRequest,
  CancelarCitaRequest,
  PedidoPor,
  TransicionEstado,
  ActualizarContactoRequest,
  PacienteActualizado,
} from './model/types'
