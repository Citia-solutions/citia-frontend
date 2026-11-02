// Tipos del feature `ver-suscripcion` (US-10, Fase 7): la suscripción de la
// organización, en lectura y solo para el administrador. En la v1 no hay
// cobro: el backend lee lo que hay en `tenants`.

/**
 * Suscripción de la organización (`GET /organizacion/suscripcion`), ya
 * traducida por `api/suscripcionApi.ts`: las fechas llegan como `Date`
 * (`null` si el texto no se pudo leer).
 */
export interface Suscripcion {
  /** Código interno del plan; hoy `'free'`. No se muestra. */
  plan: string
  /** Nombre legible del plan (provisional, Q18 del backend). */
  planNombre: string
  /** Texto del plan (p. ej. "Sin cobro durante el piloto") o `null`. */
  descripcion: string | null
  /** Alta de la organización. */
  altaEn: Date | null
  /** Siempre `null` en la v1 → "—". */
  renovacionEn: Date | null
  /** Siempre `null` en la v1 → "—". */
  metodoPago: string | null
}
