import type { Perfil, PerfilErrors, PerfilForm } from './types'

/**
 * Límites copiados a mano del backend (DTF-06). El backend valida siempre; aquí
 * solo se anticipa el 400. Se cuentan con `.length` tras recortar, como el
 * dominio.
 *
 * - `NOMBRE_MAX`: `LARGO_MAXIMO_NOMBRE` (`usuario.entity.ts`), el
 *   `@MaxLength` de `nombreCompleto` en `ActualizarPerfilDto`.
 * - `ESPECIALIDAD_MAX`: `LARGO_MAXIMO_ESPECIALIDAD`, el de `especialidad`.
 */
export const NOMBRE_MAX = 120
export const ESPECIALIDAD_MAX = 100

const NOMBRE_VACIO = 'Ingresa tu nombre.'
const NOMBRE_LARGO = `El nombre puede tener como máximo ${NOMBRE_MAX} caracteres.`
const ESPECIALIDAD_LARGA = `La especialidad puede tener como máximo ${ESPECIALIDAD_MAX} caracteres.`

export function toForm(perfil: Perfil): PerfilForm {
  return {
    nombreCompleto: perfil.nombreCompleto,
    especialidad: perfil.especialidad ?? '',
  }
}

/** Errores de formato del formulario (vacío = válido). */
export function validarPerfil(form: PerfilForm): PerfilErrors {
  const errores: PerfilErrors = {}
  const nombre = form.nombreCompleto.trim()
  if (!nombre) errores.nombreCompleto = NOMBRE_VACIO
  else if (nombre.length > NOMBRE_MAX) errores.nombreCompleto = NOMBRE_LARGO

  if (form.especialidad.trim().length > ESPECIALIDAD_MAX) errores.especialidad = ESPECIALIDAD_LARGA
  return errores
}

/**
 * Errores por campo a partir de un 400 (F6). Dos formas:
 *
 * - `mensajes` del `ValidationPipe` (inglés, nombran el campo al comienzo:
 *   `"nombreCompleto must be shorter than or equal to 120 characters"`): se
 *   traducen.
 * - `delBackend`: el texto de `PerfilInvalidoError` (español, red de seguridad
 *   del DTO): va tal cual junto a su campo.
 *
 * Lo que no se reconoce no se pierde: el caso de uso lo muestra como mensaje
 * general.
 */
export function erroresDelServidor(mensajes: string[], delBackend: string | null): PerfilErrors {
  const errores: PerfilErrors = {}

  if (delBackend?.startsWith('El nombre')) errores.nombreCompleto = delBackend
  else if (delBackend?.startsWith('La especialidad')) errores.especialidad = delBackend

  for (const mensaje of mensajes) {
    if (mensaje.startsWith('nombreCompleto ')) {
      errores.nombreCompleto ??= mensaje.includes('shorter') ? NOMBRE_LARGO : NOMBRE_VACIO
    } else if (mensaje.startsWith('especialidad ')) {
      errores.especialidad ??= mensaje.includes('shorter')
        ? ESPECIALIDAD_LARGA
        : 'El servidor rechazó la especialidad.'
    }
  }
  return errores
}
