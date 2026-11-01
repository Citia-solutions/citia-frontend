import { HttpError } from './httpClient'

/**
 * Mensajes de un 400 de validación del backend, tal como los arma el
 * `ValidationPipe` de NestJS: `{ statusCode, message: string[] | string, error }`.
 *
 *   ['paciente.correo must be an email'] · 'Envía al menos uno de estos campos: …'
 *
 * Devuelve `[]` si el fallo no es un 400 o el cuerpo no tiene esa forma. Es
 * transporte genérico: no traduce ni interpreta; cada feature decide qué hacer
 * con los mensajes (p. ej. marcar el campo que nombran).
 */
export function mensajesDeValidacion(e: unknown): string[] {
  if (!(e instanceof HttpError) || e.status !== 400) return []
  const data = e.data
  if (typeof data !== 'object' || data === null || !('message' in data)) return []

  const { message } = data as { message: unknown }
  if (typeof message === 'string') return [message]
  if (Array.isArray(message)) return message.filter((m): m is string => typeof m === 'string')
  return []
}

/**
 * `message` del cuerpo de error de NestJS cuando es **un texto**, con cualquier
 * status; `null` si el fallo no es un `HttpError`, el cuerpo no tiene esa forma
 * o `message` es una lista.
 *
 * Distingue las dos formas del backend: los errores de dominio y de límite
 * (`message: string`, en español, p. ej. *"La contraseña actual no es
 * correcta"* o el 429 del tope de soporte) se pueden mostrar tal cual; los 400
 * del `ValidationPipe` (`message: string[]`, en inglés) no: esos se leen con
 * `mensajesDeValidacion` y cada feature los traduce por nombre de campo.
 */
export function mensajeDelBackend(e: unknown): string | null {
  if (!(e instanceof HttpError)) return null
  const data = e.data
  if (typeof data !== 'object' || data === null || !('message' in data)) return null
  const { message } = data as { message: unknown }
  return typeof message === 'string' ? message : null
}
