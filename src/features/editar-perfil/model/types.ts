// Tipos del feature `editar-perfil` (US-10, Fase 7): los datos del usuario
// logueado en Mi Perfil. Es SIEMPRE el usuario del token: ningún id viaja.

// ---------------------------------------------------------------------------
// Contrato del backend (ya traducido por `api/perfilApi.ts`)
// ---------------------------------------------------------------------------

/**
 * Perfil del usuario (`GET` y `PATCH /usuarios/me`). Sin el rol: el que se
 * muestra sale de la sesión (`roleLabel(currentUser.role)`), porque la
 * traducción `ADMINISTRADOR` → `admin` vive en `features/auth` y un feature no
 * importa de otro. Sin `tenantId` ni `creadoEn`: la pantalla no los usa.
 */
export interface Perfil {
  id: string
  /** Usuario para iniciar sesión; no se puede cambiar (solo lectura). */
  email: string
  nombreCompleto: string
  /** Solo se ve en el perfil. `null` = sin especialidad. */
  especialidad: string | null
  /** Arma el enlace público `/agendar-cita/<slug>`. */
  tenantSlug: string
  /** Nombre de la organización (solo lectura). */
  tenantNombre: string
}

/**
 * Cuerpo de `PATCH /usuarios/me`. Ausente = no cambia; el front manda solo lo
 * que cambió.
 *
 * - `nombreCompleto`: no vacío tras recortar, hasta 120. `null` → 400 (el
 *   nombre no se borra).
 * - `especialidad`: hasta 100; `null` la borra (el front manda `null`, no `''`).
 */
export interface ActualizarPerfilRequest {
  nombreCompleto?: string
  especialidad?: string | null
}

// ---------------------------------------------------------------------------
// Formulario
// ---------------------------------------------------------------------------

export interface PerfilForm {
  nombreCompleto: string
  /** Vacía = sin especialidad (se envía `null`). */
  especialidad: string
}

export type PerfilField = keyof PerfilForm
export type PerfilErrors = Partial<Record<PerfilField, string>>
