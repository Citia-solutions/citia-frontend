import type { ContrasenaErrors, ContrasenaForm } from './types'

/**
 * Política de la contraseña nueva, copiada a mano del backend (DTF-06;
 * `usuario/domain/contrasena.ts`). El backend valida siempre.
 *
 * - `CONTRASENA_MIN_CARACTERES`: `LARGO_MINIMO_CONTRASENA`. Cuenta caracteres
 *   **reales** (`Array.from`), no unidades UTF-16: un emoji es uno.
 * - `CONTRASENA_MAX_BYTES`: `BYTES_MAXIMOS_CONTRASENA`. Bytes en UTF-8
 *   (`TextEncoder`): bcrypt ignora lo que pasa de 72.
 */
export const CONTRASENA_MIN_CARACTERES = 8
export const CONTRASENA_MAX_BYTES = 72

export const ACTUAL_VACIA = 'Ingresa tu contraseña actual.'
export const NUEVA_CORTA = `La nueva contraseña debe tener al menos ${CONTRASENA_MIN_CARACTERES} caracteres.`
export const NUEVA_LARGA = `La nueva contraseña es demasiado larga: como máximo ${CONTRASENA_MAX_BYTES} bytes (${CONTRASENA_MAX_BYTES} letras sin tildes; menos si lleva tildes, ñ o emojis).`
const CONFIRMACION_VACIA = 'Repite la nueva contraseña.'
const CONFIRMACION_DISTINTA = 'Las contraseñas no coinciden.'

/** Comienzo de los textos de dominio del 400 (se reconocen por el texto, riesgo 1). */
const PREFIJO_ACTUAL = 'La contraseña actual'
const PREFIJO_NUEVA = 'La nueva contraseña'

export function caracteres(texto: string): number {
  return Array.from(texto).length
}

export function bytesUtf8(texto: string): number {
  return new TextEncoder().encode(texto).length
}

/** Errores de formato del formulario (vacío = válido). */
export function validarContrasena(form: ContrasenaForm): ContrasenaErrors {
  const errores: ContrasenaErrors = {}
  if (form.actual.length === 0) errores.actual = ACTUAL_VACIA

  if (caracteres(form.nueva) < CONTRASENA_MIN_CARACTERES) errores.nueva = NUEVA_CORTA
  else if (bytesUtf8(form.nueva) > CONTRASENA_MAX_BYTES) errores.nueva = NUEVA_LARGA

  if (form.confirmacion.length === 0) errores.confirmacion = CONFIRMACION_VACIA
  else if (form.confirmacion !== form.nueva) errores.confirmacion = CONFIRMACION_DISTINTA
  return errores
}

/**
 * Errores por campo a partir de un 400 (F6):
 *
 * - `delBackend` (español, dominio): *"La contraseña actual no es correcta"* va
 *   tal cual junto a *Contraseña actual*; *"La nueva contraseña …"* (corta,
 *   larga o igual a la actual), junto a *Nueva contraseña*.
 * - `mensajes` del `ValidationPipe` (inglés): se traducen por el campo que
 *   nombran (`contrasenaActual …`, `contrasenaNueva …`).
 */
export function erroresDelServidor(mensajes: string[], delBackend: string | null): ContrasenaErrors {
  const errores: ContrasenaErrors = {}

  if (delBackend?.startsWith(PREFIJO_ACTUAL)) errores.actual = delBackend
  else if (delBackend?.startsWith(PREFIJO_NUEVA)) errores.nueva = delBackend

  for (const mensaje of mensajes) {
    if (mensaje.startsWith('contrasenaActual ')) errores.actual ??= ACTUAL_VACIA
    else if (mensaje.startsWith('contrasenaNueva ')) {
      errores.nueva ??= mensaje.includes('shorter') ? NUEVA_LARGA : NUEVA_CORTA
    }
  }
  return errores
}
