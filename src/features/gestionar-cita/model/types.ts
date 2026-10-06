// Tipos del feature `gestionar-cita` (voucher: reagendar, cancelar, confirmar
// y registrar asistencia).
import type { AppointmentAction, AppointmentStatus, AvisosCitaDto } from '@/entities/appointment'

/**
 * Transiciones de estado sin cuerpo que ofrece el voucher (lote 2 de la
 * limpieza previa al release, 2026-10-05). Son valores de `accionesPermitidas`:
 * un botón aparece solo si el backend declara la acción.
 *
 * - `confirmar`: pendiente → confirmada.
 * - `asistencia`: confirmada → asistio (terminal).
 * - `inasistencia`: confirmada → no_asistio (terminal).
 */
export type TransicionEstado = Extract<AppointmentAction, 'confirmar' | 'asistencia' | 'inasistencia'>

/** Cuerpo de `PATCH /citas/:id/reagendar`. */
export interface ReagendarCitaRequest {
  /** Nuevo instante de inicio, ISO 8601 con zona explícita (DT-14). */
  inicio: string
  /** Queda en la bitácora de la cita. Se omite si está vacío. */
  motivo?: string
}

/** Cuerpo de `PATCH /citas/:id/cancelar`. */
export interface CancelarCitaRequest {
  motivo?: string
}

/**
 * Respuesta de las transiciones (`CitaResponseDto` sin `paciente`). No trae
 * `hora`, `pacienteNombre` ni `accionesPermitidas`: tras cada acción se vuelve
 * a pedir `GET /citas/:id`.
 */
export interface CitaActualizada {
  id: string
  inicio: string
  duracionMin: number
  tipoConsulta: string
  estado: AppointmentStatus
  pacienteId: string
  /**
   * Solapamientos (ADR-11). Viene en reagendar y editar; NO en cancelar ni en
   * las demás transiciones, que no mueven la ventana. Leer con `solapamientosDe()`.
   */
  avisos?: AvisosCitaDto
}

/** Resultado de ejecutar una acción sobre la cita. */
export type ResultadoAccion =
  | { ok: true; cita: CitaActualizada }
  | { ok: false; status: number | null; mensaje: string }

// ---------------------------------------------------------------------------
// Contacto del paciente (PATCH /pacientes/:id, Fase 2 — ADR-13 §14)
// ---------------------------------------------------------------------------

/**
 * Cuerpo de `PATCH /pacientes/:id`: al menos uno de los dos. Lo que no viaja
 * no cambia; el PATCH no borra datos (`null` es un 400).
 */
export interface ActualizarContactoRequest {
  telefono?: string
  correo?: string
}

/** Respuesta de `PATCH /pacientes/:id` (`PacienteResponseDto`). */
export interface PacienteActualizado {
  id: string
  /** Formateado ('12.345.678-5') o null. */
  rut: string | null
  nombre: string
  telefono: string
  correo: string | null
  consentimiento: boolean
  tenantId: string
}

/** Resultado de guardar el contacto desde el voucher. */
export type ResultadoContacto =
  | { ok: true; paciente: PacienteActualizado; correoCambio: boolean }
  | { ok: false; status: number | null; mensaje: string }
