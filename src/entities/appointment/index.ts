// API pública del slice `appointment`. Desde fuera SIEMPRE se importa desde aquí,
// nunca apuntando a archivos internos (model/, api/, ui/).
export type {
  Appointment,
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
export { getTodayAppointments, getAppointment } from './api/appointmentApi'
export { default as AppointmentStatusBadge } from './ui/AppointmentStatusBadge.vue'
