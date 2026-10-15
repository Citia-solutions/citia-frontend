// Presentación de la hora para el PACIENTE. No reutiliza las etiquetas del
// panel (`STATUS_LABEL`): ahí "Pendiente" es jerga del profesional; aquí se
// habla en el idioma de quien recibe la hora ("Por confirmar").
import type { AppointmentStatus, StatusBadgeVariant } from '@/entities/appointment'
import { capitalizar, formatearFecha, horaEnClinica, sumarMinutos } from '@/shared/lib/fecha'

interface EstadoParaPaciente {
  texto: string
  variante: StatusBadgeVariant
}

/**
 * Estado → texto y color del badge. Con un enlace válido solo se ven
 * `pendiente` y `confirmada`, y `cancelada` justo después de cancelar (un GET
 * posterior ya es 404). Los demás se cubren por completitud, sin jerga interna.
 */
export const ESTADO_PACIENTE: Record<AppointmentStatus, EstadoParaPaciente> = {
  pendiente: { texto: 'Por confirmar', variante: 'warning' },
  confirmada: { texto: 'Confirmada', variante: 'success' },
  cancelada: { texto: 'Cancelada', variante: 'neutral' },
  asistio: { texto: 'Atendida', variante: 'info' },
  no_asistio: { texto: 'Cerrada', variante: 'neutral' },
  ghosting: { texto: 'Cerrada', variante: 'neutral' },
}

/**
 * 'martes, 14 de octubre de 2026' (zona de la clínica), para usar dentro de una
 * frase. Con año: el enlace puede abrirse meses antes.
 */
export function fechaEnFrase(inicio: string): string {
  return formatearFecha(new Date(inicio), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** 'Martes, 14 de octubre de 2026': la misma, para un título o el inicio de una frase. */
export function fechaDeLaHora(inicio: string): string {
  return capitalizar(fechaEnFrase(inicio))
}

/** '10:00' (zona de la clínica). */
export function horaDeInicio(inicio: string): string {
  return horaEnClinica(new Date(inicio))
}

/** '10:00 – 10:50' (zona de la clínica). */
export function rangoDeLaHora(inicio: string, duracionMin: number): string {
  const desde = new Date(inicio)
  return `${horaEnClinica(desde)} – ${horaEnClinica(sumarMinutos(desde, duracionMin))}`
}

/** Quita el punto final de un texto libre para poder cerrarlo con uno propio. */
export function sinPuntoFinal(texto: string): string {
  return texto.trim().replace(/[.\s]+$/, '')
}
