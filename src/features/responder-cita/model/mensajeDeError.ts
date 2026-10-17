import { HttpError } from '@/shared/api/httpClient'

/** Status HTTP del fallo, o null si no hubo respuesta (red). */
export function statusDe(e: unknown): number | null {
  return e instanceof HttpError ? e.status : null
}

/**
 * 409: el enlace es válido pero la acción ya no se puede (p. ej. confirmar una
 * hora ya confirmada, o el profesional la cambió mientras la página estaba
 * abierta). La página recarga la vista y lo dice.
 */
export const MENSAJE_NO_DISPONIBLE = 'Esta acción ya no está disponible.'

/**
 * Mensaje para el paciente de un fallo que NO cambia de pantalla. El 404 (enlace
 * no válido) y el 409 los atiende `useRespuestaCita` aparte.
 */
export function mensajeDeError(e: unknown): string {
  switch (statusDe(e)) {
    case null:
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
    case 400:
      // No debería ocurrir: el front valida lo mismo que el DTO.
      return 'No pudimos procesar tu respuesta. Revisa lo que escribiste e inténtalo de nuevo.'
    case 409:
      return MENSAJE_NO_DISPONIBLE
    case 429:
      return 'Demasiados intentos, prueba en unos minutos.'
    default:
      return 'Algo salió mal de nuestro lado. Inténtalo de nuevo en unos minutos.'
  }
}
