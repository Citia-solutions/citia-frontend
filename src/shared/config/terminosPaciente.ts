// Términos de uso y aviso de privacidad del paciente (US-11, ADR-16 del backend).
//
// Espejo del backend: la versión es la del catálogo
// (`paciente/domain/terminos-paciente.ts`) y el mensaje, el del 400
// (`paciente/presentation/dto/version-terminos.decorator.ts`). **Si cambia uno,
// cambia el otro en el mismo cambio.**
//
// El texto de la versión vive en `pages/terminos` (y su copia congelada, en
// `citia-backend/context/Cumplimiento/`). Una versión nueva del texto es una
// versión nueva aquí: texto, número y fecha juntos, con el orden de despliegue
// de ADR-16 §2 (el backend la agrega antes de que el front la envíe).
import { mensajesDeValidacion } from '@/shared/api/erroresValidacion'

/**
 * Versión del texto que muestra `/terminos`. Viaja como `terminosVersion` en el
 * formulario público, en el modal "Nueva cita" y en la aceptación de `/cita`.
 */
export const VERSION_TERMINOS_PACIENTE = '1.0'

/**
 * Día de publicación de la versión vigente ('YYYY-MM-DD'), que muestra
 * `/terminos`. Se actualiza al día del release a production.
 */
export const FECHA_TERMINOS_PACIENTE = '2026-11-15'

/** Ruta pública del texto completo (`name: 'terminos'` en el router). */
export const RUTA_TERMINOS = '/terminos'

/**
 * Mensaje fijo del 400 que da el backend cuando la versión enviada ya no recibe
 * aceptaciones (o falta). Espejo exacto de `MENSAJE_VERSION_TERMINOS_NO_VIGENTE`
 * del backend.
 */
export const MENSAJE_VERSION_TERMINOS_NO_VIGENTE =
  'La versión de los términos ya no está vigente. Recarga la página.'

/**
 * ¿El fallo es el 400 de la versión de los términos? Busca el mensaje fijo en
 * `message`, sea un texto o una lista, y **contenido** (no igual): en un campo
 * anidado (`paciente.terminosVersion` de `POST /citas`) el `ValidationPipe`
 * le antepone la ruta del campo ("paciente.La versión…").
 */
export function esVersionTerminosNoVigente(e: unknown): boolean {
  return mensajesDeValidacion(e).some((m) => m.includes(MENSAJE_VERSION_TERMINOS_NO_VIGENTE))
}
