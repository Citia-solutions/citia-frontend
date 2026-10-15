// Tipos del feature `responder-cita` (Fase 3 — US-04 + US-02.07): la página
// pública `/cita#<token>` donde el paciente, desde el enlace de su
// recordatorio, ve su hora y la confirma, la cancela o pide otra.
//
// Contrato: `citia-backend` § portal-paciente (`VistaCitaPacienteDto`). La
// vista muestra lo mínimo (decisión S2): nunca el nombre del paciente, su RUT,
// su contacto, el tipo de consulta ni ids internos.
import type { AppointmentStatus } from '@/entities/appointment'

/**
 * Lo que el paciente puede hacer ahora con su hora, calculado por el backend
 * (con `ahora < inicio`). El front no lo deriva del estado: solo muestra los
 * botones que vienen aquí.
 *
 * - `confirmar`: pendiente y sin solicitud de otra hora abierta.
 * - `cancelar`: cita vigente.
 * - `pedirOtraHora`: vigente y sin solicitud de otra hora abierta.
 */
export type AccionPaciente = 'confirmar' | 'cancelar' | 'pedirOtraHora'

/** La solicitud de otra hora que el paciente ya dejó (a lo más una abierta por cita). */
export interface SolicitudOtraHoraDto {
  /** Lo que escribió el paciente. */
  preferencia: string
  /** Instante ISO en que la pidió. */
  solicitadaEn: string
}

/**
 * Respuesta de `GET /publico/cita` y de las tres acciones
 * (`VistaCitaPacienteDto`). Tras cancelar llega con `estado: 'cancelada'` y sin
 * acciones; un GET posterior ya responde 404 (la cita es terminal).
 */
export interface VistaCitaPacienteDto {
  /** Instante ISO (UTC). Se muestra en la zona fija de Chile (`shared/lib/fecha.ts`). */
  inicio: string
  /**
   * `APP_TZ` del backend ('America/Santiago'). El front no la usa para
   * formatear: muestra todo en `ZONA_HORARIA`, que es su espejo.
   */
  zonaHoraria: string
  duracionMin: number
  estado: AppointmentStatus
  /** Nombre completo del profesional dueño de la cita. */
  profesional: string
  /** Nombre de la organización (clínica o consulta). */
  organizacion: string
  accionesPermitidas: AccionPaciente[]
  solicitudOtraHora: SolicitudOtraHoraDto | null
}

/** Cuerpo de `POST /publico/cita/cancelar`. `motivo` se omite si está vacío. */
export interface CancelarHoraRequest {
  /** Máximo 300 caracteres. */
  motivo?: string
}

/** Cuerpo de `POST /publico/cita/otra-hora`. */
export interface PedirOtraHoraRequest {
  /** Obligatoria, 1..300 caracteres. */
  preferencia: string
  /** Opcional, máximo 300. Se omite si está vacío. */
  motivo?: string
}
