import { HttpError } from '@/shared/api/httpClient'

/**
 * Tope de `duracionMin` (`@Max(1440)`, un día). Espejo de `DURACION_MAXIMA_MIN`
 * del dominio del backend (ADR-11 §2), mismo patrón que DTF-06.
 */
export const DURACION_MAXIMA_MIN = 1440

/** Status HTTP del fallo, o null si no hubo respuesta (red). */
export function statusDe(e: unknown): number | null {
  return e instanceof HttpError ? e.status : null
}

/**
 * true si el fallo deja desactualizada la bandeja: la solicitud ya se resolvió
 * (409, p. ej. otra persona del equipo la aceptó primero) o ya no existe / es
 * de otra organización (404). En ambos casos se cierra el diálogo y se recarga.
 */
export function invalidaBandeja(status: number | null): boolean {
  return status === 404 || status === 409
}

/** Traduce el fallo de aceptar o rechazar a algo accionable. */
export function mensajeDeError(e: unknown, accion: 'aceptar' | 'rechazar'): string {
  switch (statusDe(e)) {
    case null:
      return 'No pudimos conectar con el servidor. Revisa tu conexión.'
    case 400:
      // Si ocurre, el front y el DTO se desalinearon.
      return accion === 'aceptar'
        ? 'Revisa la fecha, la hora, la duración y el tipo de consulta.'
        : 'No se pudo rechazar la solicitud.'
    case 401:
      return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    case 404:
      // No se distingue "no existe" de "es de otra organización", igual que el backend.
      return 'Esta solicitud ya no está disponible.'
    case 409:
      return 'Esta solicitud ya fue resuelta, quizás por otra persona de tu equipo. Actualizamos la bandeja.'
    default:
      return accion === 'aceptar'
        ? 'No se pudo aceptar la solicitud. Inténtalo de nuevo.'
        : 'No se pudo rechazar la solicitud. Inténtalo de nuevo.'
  }
}
