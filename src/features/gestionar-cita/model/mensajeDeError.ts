import { HttpError } from '@/shared/api/httpClient'

/**
 * Límite del motivo en el front. El backend (`MotivoCitaDto`, `ReagendarCitaDto`)
 * aún no tiene `@MaxLength`; se pidió en su contraparte y, cuando exista, este
 * valor pasa a ser espejo del DTO (mismo patrón que DTF-06).
 */
export const MOTIVO_MAX = 300

/** Status HTTP del fallo, o null si no hubo respuesta (red). */
export function statusDe(e: unknown): number | null {
  return e instanceof HttpError ? e.status : null
}

/**
 * true si el fallo deja desactualizado lo que muestra el voucher: la cita
 * cambió de estado (409) o ya no existe / es de otra organización (404). En
 * esos casos el voucher recarga el detalle y la lista.
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
    case 409:
      return 'Esta cita cambió mientras la tenías abierta y ya no admite esta acción.'
    default:
      return 'No se pudo completar la acción. Inténtalo de nuevo.'
  }
}
