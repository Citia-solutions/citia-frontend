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

const FORMATO_DIA = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

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
 * La fecha se arma por componentes locales; pasar `'2026-09-18'` a `new Date()`
 * la interpretaría como UTC y en Chile mostraría el día anterior.
 */
export function aPreferenciaHoraria(fecha: string, hora: string): string {
  const partes = fecha.split('-')
  const anio = Number(partes[0])
  const mes = Number(partes[1])
  const dia = Number(partes[2])

  if ([anio, mes, dia].some(Number.isNaN)) return `${fecha} ${hora}`.trim()

  return `${FORMATO_DIA.format(new Date(anio, mes - 1, dia))} a las ${hora}`
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
