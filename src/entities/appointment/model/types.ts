// Tipos de la entidad de negocio `appointment` (cita).
//
// Los identificadores van en inglés (convención del slice), pero los VALORES de
// estado y de acción se usan tal como viajan en el contrato del backend: son
// datos, no nombres de código.

/**
 * Los seis estados reales de una cita en el backend (ADR-04).
 *
 * Los dos valores extra del diseño de US-06 (cupo recuperado y riesgo alto)
 * salieron de aquí: no son estados de una cita. El riesgo es una calificación
 * del paciente (RF-08) y el cupo recuperado es el origen del cupo (motor de
 * lista de espera); mezclarlos impedía que una cita fuera, p. ej., "confirmada
 * y de riesgo alto" a la vez.
 */
export type AppointmentStatus =
  | 'pendiente'
  | 'confirmada'
  | 'cancelada'
  | 'asistio'
  | 'no_asistio'
  | 'ghosting'

/**
 * Acciones que el backend declara legales para una cita en su estado actual
 * (`accionesPermitidas` de `GET /citas/:id`). Mismo vocabulario que las rutas.
 * Es una pista de interfaz, no una autorización: un 409 sigue siendo posible.
 */
export type AppointmentAction =
  | 'confirmar'
  | 'cancelar'
  | 'reagendar'
  | 'asistencia'
  | 'inasistencia'
  | 'editar'

/** Una cita tal como la muestra la lista del día (`GET /citas/hoy`). */
export interface Appointment {
  id: string
  /** 'HH:mm' ya proyectado a la zona de la clínica por el backend. Mostrar tal cual. */
  time: string
  /** Instante de inicio (ISO). Solo para comparar con "ahora" y prellenar el reagendar. */
  startsAt: string
  patientName: string // "María González"
  type: string // "Terapia individual"
  durationMin: number // 50
  status: AppointmentStatus
  /**
   * Día calendario 'YYYY-MM-DD' en la zona de la clínica, tal como lo manda el
   * backend (`fecha`, desde el cierre de Fase 1). Opcional porque el detalle
   * (`GET /citas/:id`) no lo trae y un backend anterior tampoco en `/hoy`.
   */
  date?: string
}

/**
 * Una cita de la agenda por rango (`GET /citas?desde&hasta`) o de un aviso de
 * solapamiento: ahí `date` viene siempre y es por lo que se agrupa por día.
 * El front NO lo deriva de `startsAt` (ADR-07: el backend proyecta).
 */
export interface AgendaAppointment extends Appointment {
  date: string
}

/** Datos del paciente que trae el detalle de una cita. */
export interface AppointmentPatient {
  id: string
  name: string
  /** Ya formateado por el backend ('12.345.678-5'), o null si no tiene. */
  rut: string | null
  phone: string
  email: string | null
}

/**
 * Quién hizo un cambio de la cita, según la bitácora del backend
 * (`confirmadaPor` / `canceladaPor` de `GET /citas/:id`, Fase 3). `paciente`
 * es la respuesta desde el enlace del correo (`/cita`); `sistema`, un job.
 */
export type AppointmentActor = 'paciente' | 'profesional' | 'sistema'

/** Detalle completo de una cita (`GET /citas/:id`). */
export interface AppointmentDetail extends Appointment {
  patient: AppointmentPatient
  allowedActions: AppointmentAction[]
  /**
   * Quién hizo el último cambio a `confirmada` (Fase 3). null si nunca se
   * confirmó o si el backend todavía no manda el campo.
   */
  confirmedBy: AppointmentActor | null
  /** Quién la canceló (Fase 3). null si no está cancelada o si el campo no viene. */
  cancelledBy: AppointmentActor | null
}
