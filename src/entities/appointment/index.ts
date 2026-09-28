// API pública del slice `appointment`. Desde fuera SIEMPRE se importa desde aquí,
// nunca apuntando a archivos internos (model/, api/, ui/).
export type {
  Appointment,
  AgendaAppointment,
  AppointmentStatus,
  AppointmentAction,
  AppointmentDetail,
  AppointmentPatient,
} from './model/types'
export {
  STATUS_LABEL,
  STATUS_BADGE_VARIANT,
  isTerminalStatus,
  isPastAppointment,
  type StatusBadgeVariant,
} from './model/status'
export { useTodayAppointments } from './model/useTodayAppointments'
export { useAgendaAppointments } from './model/useAgendaAppointments'
export {
  getTodayAppointments,
  getAppointmentsInRange,
  getAppointment,
  solapamientosDe,
  MAX_DIAS_RANGO,
  type CitaDashboardDto,
  type CitaAgendaDto,
  type AvisosCitaDto,
} from './api/appointmentApi'
export { default as AppointmentStatusBadge } from './ui/AppointmentStatusBadge.vue'
export { default as AvisoSolapamiento } from './ui/AvisoSolapamiento.vue'
