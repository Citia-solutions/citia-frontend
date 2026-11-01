import type { CategoriaSoporte, MensajeSoporteErrors, MensajeSoporteForm } from './types'

/**
 * Largo máximo del mensaje: espejo a mano de `LARGO_MAXIMO_MENSAJE_SOPORTE`
 * (`soporte/domain/limites-soporte.ts`), el `@MaxLength` de
 * `CrearMensajeSoporteDto` (DTF-06). Se cuenta con `.length` tras recortar los
 * extremos, como el DTO.
 */
export const MENSAJE_MAX = 2000

/**
 * Aviso fijo del modal (F8). **No promete respuesta por correo**: sin casilla
 * de soporte (Q19 del backend) los mensajes no salen en production. Cuando se
 * resuelva, se agrega "Te responderemos a <correo>".
 */
export const AVISO_DATOS_PACIENTES =
  'No incluyas datos de tus pacientes (nombres, RUT, diagnósticos).'

/** Con el 201 (F8): cierto aunque el correo a soporte todavía no salga. */
export const MENSAJE_RECIBIDO = 'Recibimos tu mensaje.'

/** Orden y etiquetas de las categorías; ninguna marcada al abrir (F3). */
export const CATEGORIAS: readonly { valor: CategoriaSoporte; etiqueta: string }[] = [
  { valor: 'problema', etiqueta: 'Problema' },
  { valor: 'consulta', etiqueta: 'Consulta' },
  { valor: 'sugerencia', etiqueta: 'Sugerencia' },
  { valor: 'otro', etiqueta: 'Otro' },
]

const CATEGORIA_REQUERIDA = 'Elige una categoría.'
const MENSAJE_VACIO = 'Escribe tu mensaje.'
const MENSAJE_LARGO = `El mensaje puede tener como máximo ${MENSAJE_MAX} caracteres.`

/** Comienzo del texto de `MensajeSoporteInvalidoError` (dominio, red de seguridad del DTO). */
const PREFIJO_MENSAJE_INVALIDO = 'Mensaje a soporte inválido'

/** Errores de formato del formulario (vacío = válido). */
export function validarMensaje(form: MensajeSoporteForm): MensajeSoporteErrors {
  const errores: MensajeSoporteErrors = {}
  if (form.categoria === null) errores.categoria = CATEGORIA_REQUERIDA

  const texto = form.mensaje.trim()
  if (!texto) errores.mensaje = MENSAJE_VACIO
  else if (texto.length > MENSAJE_MAX) errores.mensaje = MENSAJE_LARGO
  return errores
}

/**
 * Errores por campo a partir de un 400 (F6):
 *
 * - `delBackend` (español, dominio): el de `MensajeSoporteInvalidoError` va
 *   tal cual junto al campo que nombra (el texto o la categoría).
 * - `mensajes` del `ValidationPipe`: `mensaje …` (inglés) se traduce;
 *   `categoria debe ser …` (en español, pero con el nombre del campo) se
 *   cambia por el aviso de la pantalla.
 */
export function erroresDelServidor(
  mensajes: string[],
  delBackend: string | null,
): MensajeSoporteErrors {
  const errores: MensajeSoporteErrors = {}

  // "Mensaje a soporte inválido (<campo>): <detalle>"
  if (delBackend?.startsWith(`${PREFIJO_MENSAJE_INVALIDO} (categoria)`)) errores.categoria = delBackend
  else if (delBackend?.startsWith(PREFIJO_MENSAJE_INVALIDO)) errores.mensaje = delBackend

  for (const mensaje of mensajes) {
    if (mensaje.startsWith('mensaje ')) {
      errores.mensaje ??= mensaje.includes('shorter') ? MENSAJE_LARGO : MENSAJE_VACIO
    } else if (mensaje.startsWith('categoria ')) {
      errores.categoria ??= CATEGORIA_REQUERIDA
    }
  }
  return errores
}
