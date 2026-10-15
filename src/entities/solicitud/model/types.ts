// Tipos de la entidad `solicitud`: la petición de hora que deja un paciente en
// el enlace público (`/agendar-cita/:tenantSlug`) y que el profesional resuelve
// en la bandeja. Una solicitud NO es una cita: aceptarla CREA una (ADR-09).
//
// Desde la Fase 3 hay un segundo tipo: el paciente que ya tiene hora pide otra
// desde el enlace de su recordatorio (`/cita`). Esa solicitud (`reagendamiento`)
// apunta a su cita (`citaOrigenId`) y aceptarla MUEVE esa cita, no crea otra.
//
// A diferencia de `appointment`, este slice nombra en español: es el mismo
// vocabulario del backend y del flujo público (`crear-cita`), y traducirlo solo
// agregaría una tabla de equivalencias.

/**
 * Estados de una solicitud (`EstadoSolicitud` del backend). `descartada` (Fase 3)
 * es terminal y la pone el sistema: una solicitud de otra hora cuya cita se
 * canceló o se cerró (asistió / no asistió) antes de que alguien la resolviera.
 */
export type EstadoSolicitud = 'recibida' | 'aceptada' | 'rechazada' | 'descartada'

/**
 * Tipo de solicitud (Fase 3). `nueva`: un paciente pide hora por el enlace de
 * agenda. `reagendamiento`: un paciente con hora pide otra desde `/cita`.
 */
export type TipoSolicitud = 'nueva' | 'reagendamiento'

/**
 * Estado de la cita de origen. Mismo vocabulario que `AppointmentStatus` de
 * `entities/appointment` (los seis estados de ADR-04): se repite aquí porque
 * un slice de entidades no importa de otro (FSD). Al ser el mismo union, TS
 * los trata como intercambiables.
 */
export type EstadoCitaOrigen =
  | 'pendiente'
  | 'confirmada'
  | 'cancelada'
  | 'asistio'
  | 'no_asistio'
  | 'ghosting'

/** Lo que la bandeja muestra de la cita de una solicitud de otra hora. */
export interface CitaOrigen {
  /** Instante ISO (UTC) de la hora que tiene hoy la cita. */
  inicio: string
  duracionMin: number
  estado: EstadoCitaOrigen
}

/** Una solicitud tal como la muestra la bandeja. */
export interface Solicitud {
  id: string
  estado: EstadoSolicitud
  /** `nueva` si el backend no lo manda (anterior a la Fase 3). */
  tipo: TipoSolicitud
  /**
   * Ya formateado por el backend ('11.111.111-1'). Nunca va en la URL. null en
   * una de otra hora de un paciente sin RUT (los datos salen de su ficha, y el
   * alta manual permite pacientes sin RUT).
   */
  rut: string | null
  nombrePaciente: string
  telefono: string
  correo: string | null
  /** '' si no hay (el motivo es opcional al pedir otra hora). */
  motivo: string
  /**
   * Texto libre. En una `nueva` lo armó el flujo público ('viernes, 18 de
   * septiembre a las 10:00'); en una de otra hora lo escribió el paciente. No
   * reserva nada.
   */
  preferenciaHoraria: string
  consentimiento: boolean
  /** Instante ISO en que llegó. */
  recibidaEn: string
  /** Instante ISO en que se resolvió (aceptada, rechazada o descartada); null mientras está `recibida`. */
  resueltaEn: string | null
  /** Cita creada (o movida, si es de otra hora) al aceptar; null si no se aceptó. */
  citaId: string | null
  /** Cita sobre la que se pide otra hora; null en una `nueva`. */
  citaOrigenId: string | null
  /** Hora actual de esa cita; null en una `nueva` (o si el backend no la manda). */
  citaOrigen: CitaOrigen | null
}
