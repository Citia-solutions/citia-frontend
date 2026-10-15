/**
 * Largo máximo de los textos del paciente (preferencia y motivos). Espejo de
 * los `@MaxLength(300)` del portal del paciente en el backend — copia a mano,
 * mismo patrón que DTF-06. Corto a propósito: una caja grande invita a escribir
 * información clínica (mismo criterio que el motivo del flujo público).
 */
export const LIMITE_TEXTO = 300

/** Error de la preferencia de otra hora (obligatoria, 1..300), o null. */
export function errorPreferencia(texto: string): string | null {
  const limpio = texto.trim()
  if (!limpio) return 'Cuéntanos qué días y horarios te acomodan.'
  if (limpio.length > LIMITE_TEXTO) return `Usa como máximo ${LIMITE_TEXTO} caracteres.`
  return null
}

/** Error de un motivo opcional (máximo 300), o null. */
export function errorMotivo(texto: string): string | null {
  return texto.trim().length > LIMITE_TEXTO ? `Usa como máximo ${LIMITE_TEXTO} caracteres.` : null
}
