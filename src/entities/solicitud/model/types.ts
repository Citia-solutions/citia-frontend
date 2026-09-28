// Tipos de la entidad `solicitud`: la petición de hora que deja un paciente en
// el enlace público (`/agendar-cita/:tenantSlug`) y que el profesional resuelve
// en la bandeja. Una solicitud NO es una cita: aceptarla CREA una (ADR-09).
//
// A diferencia de `appointment`, este slice nombra en español: es el mismo
// vocabulario del backend y del flujo público (`crear-cita`), y traducirlo solo
// agregaría una tabla de equivalencias.

/** Estados de una solicitud (`EstadoSolicitud` del backend). */
export type EstadoSolicitud = 'recibida' | 'aceptada' | 'rechazada'

/** Una solicitud tal como la muestra la bandeja. */
export interface Solicitud {
  id: string
  estado: EstadoSolicitud
  /** Ya formateado por el backend ('11.111.111-1'). Nunca va en la URL. */
  rut: string
  nombrePaciente: string
  telefono: string
  correo: string | null
  motivo: string
  /** Texto libre que armó el flujo público ('viernes, 18 de septiembre a las 10:00'). No reserva nada. */
  preferenciaHoraria: string
  consentimiento: boolean
  /** Instante ISO en que llegó. */
  recibidaEn: string
  /** Instante ISO en que se aceptó o rechazó; null mientras está `recibida`. */
  resueltaEn: string | null
  /** Cita creada al aceptar; null si no se aceptó. */
  citaId: string | null
}
