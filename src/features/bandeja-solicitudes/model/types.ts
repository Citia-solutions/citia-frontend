// Tipos del feature `bandeja-solicitudes`: listar, aceptar y rechazar las
// solicitudes que llegan por el enlace público y, desde la Fase 3, las de otra
// hora que llegan desde el enlace del recordatorio (`/cita`).
import type { AppointmentStatus, AvisosCitaDto } from '@/entities/appointment'
import type { Solicitud, SolicitudBandejaDto } from '@/entities/solicitud'

/** Cuerpo de `POST /solicitudes/:id/aceptar` para una solicitud `nueva`: crea la cita. */
export interface AceptarSolicitudNuevaRequest {
  /** Instante ISO con zona explícita OBLIGATORIA (la ruta nace sin DT-14). */
  inicio: string
  /** Entero, 1..1440 (`@Max(1440)`, ADR-11 §2). */
  duracionMin: number
  /** Se precarga con el `motivo` de la solicitud y el profesional lo ajusta. */
  tipoConsulta: string
}

/**
 * Cuerpo de `POST /solicitudes/:id/aceptar` para una de otra hora
 * (`reagendamiento`, Fase 3): solo la nueva hora. La cita original se mueve
 * con su duración y su tipo; el backend ignoraría `duracionMin` y `tipoConsulta`.
 */
export interface AceptarReagendamientoRequest {
  inicio: string
}

/** Cuerpo de `POST /solicitudes/:id/aceptar`, según el tipo de la solicitud. */
export type AceptarSolicitudRequest = AceptarSolicitudNuevaRequest | AceptarReagendamientoRequest

/**
 * La cita creada al aceptar: exactamente la respuesta de `POST /citas`. En una
 * solicitud de otra hora (Fase 3) es la cita original ya movida (misma forma
 * que la respuesta de reagendar). Se declara aquí (y no se importa de
 * `crear-cita`) porque en FSD un feature no importa a otro; solo se tipa lo que
 * la bandeja usa.
 */
export interface CitaDeSolicitud {
  id: string
  inicio: string
  duracionMin: number
  tipoConsulta: string
  estado: AppointmentStatus
  pacienteId: string
  /** Siempre viene según el contrato; se tolera ausente. Leer con `solapamientosDe()`. */
  avisos?: AvisosCitaDto
}

/** Respuesta 201 de `POST /solicitudes/:id/aceptar` (misma forma para los dos tipos). */
export interface SolicitudAceptadaDto {
  solicitud: SolicitudBandejaDto
  cita: CitaDeSolicitud
}

/** Resultado de aceptar ya traducido. */
export interface SolicitudAceptada {
  solicitud: Solicitud
  cita: CitaDeSolicitud
}

/** Resultado de una acción de la bandeja (aceptar o rechazar). */
export type ResultadoResolucion<T> =
  | { ok: true; valor: T }
  | { ok: false; status: number | null; mensaje: string }
