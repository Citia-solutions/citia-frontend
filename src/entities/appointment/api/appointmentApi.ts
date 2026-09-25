import { http } from '@/shared/api/httpClient'
import type {
  Appointment,
  AppointmentAction,
  AppointmentDetail,
  AppointmentStatus,
} from '../model/types'

// ---------------------------------------------------------------------------
// Contrato del backend (formas tal como viajan)
// ---------------------------------------------------------------------------

/** Elemento de `GET /citas/hoy` (`CitaDashboardDto`). */
export interface CitaDashboardDto {
  id: string
  pacienteNombre: string
  /** 'HH:mm' en zona de la clínica. */
  hora: string
  /** Instante ISO (UTC). */
  inicio: string
  duracionMin: number
  tipoConsulta: string
  estado: AppointmentStatus
}

/** Respuesta de `GET /citas/:id` (`CitaDetalleDto`). */
export interface CitaDetalleDto {
  id: string
  estado: AppointmentStatus
  inicio: string
  hora: string
  duracionMin: number
  tipoConsulta: string
  paciente: {
    id: string
    nombre: string
    rut: string | null
    telefono: string
    correo: string | null
  }
  accionesPermitidas: AppointmentAction[]
}

// ---------------------------------------------------------------------------
// Traducción DTO → modelo. Si el backend renombra un campo, se toca solo aquí.
// ---------------------------------------------------------------------------

export function toAppointment(dto: CitaDashboardDto): Appointment {
  return {
    id: dto.id,
    time: dto.hora,
    startsAt: dto.inicio,
    patientName: dto.pacienteNombre,
    type: dto.tipoConsulta,
    durationMin: dto.duracionMin,
    status: dto.estado,
  }
}

export function toAppointmentDetail(dto: CitaDetalleDto): AppointmentDetail {
  return {
    id: dto.id,
    time: dto.hora,
    startsAt: dto.inicio,
    patientName: dto.paciente.nombre,
    type: dto.tipoConsulta,
    durationMin: dto.duracionMin,
    status: dto.estado,
    patient: {
      id: dto.paciente.id,
      name: dto.paciente.nombre,
      rut: dto.paciente.rut,
      phone: dto.paciente.telefono,
      email: dto.paciente.correo,
    },
    allowedActions: dto.accionesPermitidas,
  }
}

// ---------------------------------------------------------------------------
// Llamadas. Las rutas van SIN `/api`: ya viene en `VITE_API_URL`.
// ---------------------------------------------------------------------------

/**
 * GET /citas/hoy — citas del día del profesional logueado.
 *
 * Viene ordenada por `inicio` (el front no reordena) y NO filtra por estado:
 * una cita cancelada hoy sigue viniendo con `estado: 'cancelada'`.
 */
export async function getTodayAppointments(): Promise<Appointment[]> {
  const dtos = await http.get<CitaDashboardDto[]>('/citas/hoy')
  return dtos.map(toAppointment)
}

/**
 * GET /citas/:id — detalle con datos de contacto del paciente y las acciones
 * que el backend declara legales. 404 si no existe o es de otra organización.
 */
export async function getAppointment(id: string): Promise<AppointmentDetail> {
  const dto = await http.get<CitaDetalleDto>(`/citas/${encodeURIComponent(id)}`)
  return toAppointmentDetail(dto)
}
