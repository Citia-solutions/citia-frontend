import { HttpError } from '@/shared/api/httpClient'

/**
 * Límite del motivo en el front: espejo a mano de `@MaxLength(300)` de
 * `MotivoCitaDto` y `ReagendarCitaDto` del backend (DTF-06).
 */
export const MOTIVO_MAX = 300

/**
 * Aviso de "¿Quién lo pidió?" sin responder (US-07.01). La pregunta es
 * obligatoria en la pantalla de cancelar y en la de reagendar.
 */
export const PEDIDO_POR_REQUERIDO = 'Indica quién pidió el cambio.'

/**
 * Comienzo del mensaje de `CitaAunNoComienzaError` (US-07.01): 409 al marcar
 * la asistencia o la inasistencia antes de la hora de inicio. El backend no
 * manda un código propio, así que se reconoce por el texto:
 * *"La cita todavía no comienza: la asistencia y la inasistencia se marcan
 * desde su hora de inicio"*.
 */
const AUN_NO_COMIENZA = 'La cita todavía no comienza'

/** Status HTTP del fallo, o null si no hubo respuesta (red). */
export function statusDe(e: unknown): number | null {
  return e instanceof HttpError ? e.status : null
}

/** `message` del cuerpo de error de NestJS cuando es un texto, o null. */
function mensajeDelBackend(e: unknown): string | null {
  if (!(e instanceof HttpError)) return null
  const data = e.data
  if (typeof data !== 'object' || data === null || !('message' in data)) return null
  const { message } = data as { message: unknown }
  return typeof message === 'string' ? message : null
}

/**
 * true si el fallo deja desactualizado lo que muestra el voucher: la cita
 * cambió de estado o todavía no comienza (409), o ya no existe / es de otra
 * organización (404). En esos casos el voucher recarga el detalle y la lista.
 */
export function invalidaVoucher(status: number | null): boolean {
  return status === 404 || status === 409
}

/** Traduce el fallo de una acción del voucher a algo accionable. */
export function mensajeDeError(e: unknown): string {
  switch (statusDe(e)) {
    case null:
      return 'No pudimos conectar con el servidor. Revisa tu conexión.'
    case 400:
      // Si ocurre, el front y el DTO se desalinearon.
      return 'Revisa la fecha y hora elegidas.'
    case 401:
      return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    case 404:
      // No se distingue "no existe" de "es de otra organización".
      return 'Esta cita ya no está disponible.'
    case 409: {
      // Asistencia / inasistencia antes de la hora de inicio (US-07.01): el
      // mensaje del backend explica justo lo que pasó, así que va tal cual. El
      // reloj del equipo puede ir adelantado respecto del servidor.
      const delBackend = mensajeDelBackend(e)
      if (delBackend?.startsWith(AUN_NO_COMIENZA)) return delBackend
      return 'Esta cita cambió mientras la tenías abierta y ya no admite esta acción.'
    }
    default:
      return 'No se pudo completar la acción. Inténtalo de nuevo.'
  }
}
