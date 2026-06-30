// Tipos de la entidad de negocio `appointment` (cita).

export type AppointmentStatus = 'confirmada' | 'pendiente' | 'recuperada' | 'riesgo_alto'

export interface Appointment {
  id: string
  time: string // "09:00"
  patientName: string // "María González"
  type: string // "Terapia individual"
  durationMin: number // 50
  status: AppointmentStatus
}
