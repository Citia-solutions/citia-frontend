// Tipos del feature `contactar-soporte` (US-10, Fase 7): un mensaje del
// usuario logueado a soporte. Quién escribe sale del token: ningún id viaja.

// ---------------------------------------------------------------------------
// Contrato del backend
// ---------------------------------------------------------------------------

/** Las cuatro categorías que acepta el backend (`CategoriaSoporte`). */
export type CategoriaSoporte = 'problema' | 'consulta' | 'sugerencia' | 'otro'

/**
 * Cuerpo de `POST /soporte/mensajes`. En la API `categoria` es opcional (→
 * `otro`); en la pantalla es obligatoria (F3), así que el front la manda
 * siempre.
 */
export interface CrearMensajeSoporteRequest {
  categoria: CategoriaSoporte
  /** De 1 a 2000 caracteres tras recortar los extremos. */
  mensaje: string
}

/** Respuesta 201, ya traducida: el id y cuándo quedó guardado. */
export interface MensajeSoporteCreado {
  id: string
  creadoEn: Date | null
}

// ---------------------------------------------------------------------------
// Formulario
// ---------------------------------------------------------------------------

export interface MensajeSoporteForm {
  /** Ninguna marcada al abrir (F3): `null` hasta que se elige. */
  categoria: CategoriaSoporte | null
  mensaje: string
}

export type MensajeSoporteField = keyof MensajeSoporteForm
export type MensajeSoporteErrors = Partial<Record<MensajeSoporteField, string>>
