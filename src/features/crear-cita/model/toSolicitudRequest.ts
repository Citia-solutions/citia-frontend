import { fechaCalendario, formatearFechaLarga } from '@/shared/lib/fecha'
import { normalizarRut } from '@/shared/lib/rut'
import type { FlujoCitaForm } from './flujoCitaModel'

/** Cuerpo que espera POST /publico/:tenantSlug/solicitudes. */
export interface SolicitudRequest {
  rut: string
  nombrePaciente: string
  telefono: string
  correo: string
  motivo: string
  preferenciaHoraria: string
  consentimiento: boolean
}

export interface SolicitudRecibida {
  mensaje: string
}

/**
 * Convierte el día y la hora elegidos en una **preferencia legible**.
 *
 *   ('2026-09-18', '10:00') -> 'jueves, 18 de septiembre a las 10:00'
 *
 * El paciente elige un día y una hora concretos porque es la forma más clara de
 * expresar cuándo le acomoda, pero eso **no reserva nada**: el profesional lee
 * la preferencia y fija la hora real al aceptar la solicitud. Por eso viaja como
 * texto y no como un instante.
 *
 * El día se formatea con `fechaCalendario` (no con `new Date('2026-09-18')`, que
 * lo leería como medianoche UTC y en Chile mostraría el día anterior). El texto
 * tiene que seguir calzando con `sugerirInicio` (bandeja), que lo lee para
 * precargar la hora al aceptar.
 */
export function aPreferenciaHoraria(fecha: string, hora: string): string {
  try {
    return `${formatearFechaLarga(fechaCalendario(fecha))} a las ${hora}`
  } catch {
    return `${fecha} ${hora}`.trim()
  }
}

/**
 * Traduce el formulario del paciente al contrato del backend.
 *
 * Dos ajustes de forma:
 *  - el diseño separa nombre y apellidos; el backend guarda un solo campo;
 *  - día + hora se combinan en `preferenciaHoraria` (ver arriba).
 */
export function toSolicitudRequest(form: FlujoCitaForm): SolicitudRequest {
  return {
    rut: normalizarRut(form.rut),
    nombrePaciente: `${form.nombre.trim()} ${form.apellidos.trim()}`.trim(),
    telefono: form.telefono.trim(),
    correo: form.correo.trim(),
    motivo: form.motivo.trim(),
    preferenciaHoraria: aPreferenciaHoraria(form.fecha, form.hora),
    consentimiento: form.consentimiento,
  }
}
