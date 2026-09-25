// Tipos del feature `crear-cita`.
import type { AppointmentStatus } from '@/entities/appointment'

// ---------------------------------------------------------------------------
// Formulario (lo que ve y llena el profesional)
// ---------------------------------------------------------------------------

/** Valores del formulario de "Nueva cita". */
export interface NuevaCitaForm {
  /** RUT del paciente. Es su identidad: si ya existe, la cita se vincula al
   *  paciente existente en vez de duplicarlo. Opcional para personas sin RUT. */
  rut: string
  pacienteNombre: string
  correo: string
  telefono: string
  fecha: string // 'YYYY-MM-DD'
  hora: string // 'HH:mm'
  duracionMin: number
  motivo: string
  /** Consentimiento del paciente para recibir mensajes. Requisito legal. */
  consentimiento: boolean
}

/** Pares de errores por campo (solo los que fallaron). */
export type NuevaCitaField = keyof NuevaCitaForm
export type NuevaCitaErrors = Partial<Record<NuevaCitaField, string>>

/** Carga útil que se entrega hacia fuera al intentar guardar. */
export type NuevaCitaPayload = NuevaCitaForm

// ---------------------------------------------------------------------------
// Contrato del backend (POST /citas)
// ---------------------------------------------------------------------------

/**
 * Datos del paciente tal como los espera el backend. `tenantId` y `usuarioId`
 * NO viajan en el cuerpo: el servidor los saca del token.
 */
export interface PacienteEnCitaRequest {
  rut?: string
  nombre: string
  telefono: string
  correo?: string
  consentimiento: boolean
}

export interface CrearCitaRequest {
  /** Instante de inicio, ISO 8601 con zona explícita. */
  inicio: string
  duracionMin: number
  tipoConsulta: string
  paciente: PacienteEnCitaRequest
}

export interface PacienteResumen {
  id: string
  rut: string | null
  nombre: string
  telefono: string
  correo: string | null
  consentimiento: boolean
  tenantId: string
}

/** Respuesta de POST /citas. */
export interface CitaCreada {
  id: string
  inicio: string
  duracionMin: number
  tipoConsulta: string
  /** Estado de la cita: el tipo único vive en `entities/appointment`. */
  estado: AppointmentStatus
  pacienteId: string
  /**
   * El paciente con el que quedó vinculada la cita: puede ser uno recién
   * creado o uno ya existente al que se llegó por RUT. Solo viene al crear.
   */
  paciente?: PacienteResumen
}
