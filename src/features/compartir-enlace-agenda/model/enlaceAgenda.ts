/**
 * ¿El enlace público está listo para compartirse fuera del equipo?
 *
 * No todavía: la ruta pública de solicitudes no tiene límite de tasa (DT-18 del
 * backend). Mostrar el enlace no es publicarlo, pero lo facilita, así que el
 * botón va acompañado de una advertencia mientras esto sea `false`. Cuando
 * DT-18 se cierre, basta con cambiarlo a `true` para quitarla.
 */
export const ENLACE_PUBLICO_LISTO = false

/**
 * Copia un texto al portapapeles. Devuelve false si el navegador no lo permite
 * (contexto no seguro, permiso denegado): la UI ofrece entonces el enlace
 * seleccionado para copiarlo a mano.
 */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) return false
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}
