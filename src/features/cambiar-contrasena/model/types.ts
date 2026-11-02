// Tipos del feature `cambiar-contrasena` (US-10, Fase 7): la pestaña
// "Seguridad" de Mi Perfil.

// ---------------------------------------------------------------------------
// Contrato del backend
// ---------------------------------------------------------------------------

/**
 * Cuerpo de `PUT /usuarios/me/contrasena`. Las contraseñas viajan tal cual se
 * escribieron: **no se recortan nunca** (ni aquí ni en el backend).
 */
export interface CambiarContrasenaRequest {
  contrasenaActual: string
  contrasenaNueva: string
}

/**
 * Respuesta 200: el token **nuevo** de esta sesión. Los anteriores (de esta y
 * de las demás sesiones) dejan de valer; el front reemplaza el guardado.
 */
export interface ContrasenaCambiada {
  accessToken: string
}

// ---------------------------------------------------------------------------
// Formulario
// ---------------------------------------------------------------------------

export interface ContrasenaForm {
  actual: string
  nueva: string
  /** Solo en el front: no viaja. */
  confirmacion: string
}

export type ContrasenaField = keyof ContrasenaForm
export type ContrasenaErrors = Partial<Record<ContrasenaField, string>>
