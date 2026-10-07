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
