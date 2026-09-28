// Tipos del feature `gestionar-cita` (voucher: reagendar y cancelar).
import type { AppointmentStatus, AvisosCitaDto } from '@/entities/appointment'

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
