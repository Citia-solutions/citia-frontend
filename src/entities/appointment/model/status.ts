// Presentación de los estados de una cita: etiqueta, color y qué significan.
// Lo usan la lista del día y el voucher, para que una misma cita se vea igual
// en los dos lugares.
import type { Appointment, AppointmentStatus } from './types'

export type StatusBadgeVariant = 'success' | 'warning' | 'info' | 'danger' | 'neutral'

/** Estado → etiqueta legible. */
export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  asistio: 'Asistió',
  no_asistio: 'No asistió',
  // "ghosting" es jerga interna: el profesional entiende mejor que el paciente
  // nunca respondió.
  ghosting: 'Sin respuesta',
}

/** Estado → variante de `BaseBadge`. */
export const STATUS_BADGE_VARIANT: Record<AppointmentStatus, StatusBadgeVariant> = {
  pendiente: 'warning',
  confirmada: 'success',
  cancelada: 'neutral',
  asistio: 'info',
  no_asistio: 'danger',
  ghosting: 'danger',
}

const ESTADOS_TERMINALES: ReadonlySet<AppointmentStatus> = new Set([
  'cancelada',
  'asistio',
  'no_asistio',
  'ghosting',
])

/**
 * true si la cita ya no admite cambios. Sirve para la PRESENTACIÓN (atenuar la
 * fila, explicar en el voucher por qué no hay acciones). Qué acciones se
 * habilitan lo decide `accionesPermitidas` del backend, no esta función.
 */
export function isTerminalStatus(status: AppointmentStatus): boolean {
  return ESTADOS_TERMINALES.has(status)
}

/** true si la cita ya terminó: `inicio + duración < ahora`. */
export function isPastAppointment(appointment: Appointment, now: Date = new Date()): boolean {
  const fin = new Date(appointment.startsAt).getTime() + appointment.durationMin * 60_000
  return fin < now.getTime()
}
