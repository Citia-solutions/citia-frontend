import { http } from '@/shared/api/httpClient'
import type {
  AgendaAppointment,
  Appointment,
  AppointmentAction,
  AppointmentDetail,
  AppointmentStatus,
} from '../model/types'

// ---------------------------------------------------------------------------
// Contrato del backend (formas tal como viajan)
// ---------------------------------------------------------------------------

/**
 * Elemento de `GET /citas/hoy`, de `GET /citas?desde&hasta` y de
 * `avisos.solapamientos` (`CitaDashboardDto`).
 */
export interface CitaDashboardDto {
  id: string
  pacienteNombre: string
  /**
   * 'YYYY-MM-DD' en zona de la clínica. Llega desde el cierre de Fase 1; en
   * `/hoy` de un backend anterior puede faltar (el dashboard no lo usa).
   */
  fecha?: string
  /** 'HH:mm' en zona de la clínica. */
  hora: string
  /** Instante ISO (UTC). */
  inicio: string
  duracionMin: number
  tipoConsulta: string
  estado: AppointmentStatus
}

/** Elemento de `GET /citas?desde&hasta` y de los avisos: ahí `fecha` viene siempre. */
export type CitaAgendaDto = CitaDashboardDto & { fecha: string }

/**
 * Avisos que traen las respuestas de crear, reagendar, editar y aceptar una
 * solicitud (ADR-11, "avisar y permitir"). Es información: la operación ya se
 * hizo. Se tipa opcional en cada respuesta para tolerar un backend que aún no
 * lo manda.
 */
export interface AvisosCitaDto {
  solapamientos: CitaAgendaDto[]
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
    ...(dto.fecha ? { date: dto.fecha } : {}),
  }
}

export function toAgendaAppointment(dto: CitaAgendaDto): AgendaAppointment {
  return { ...toAppointment(dto), date: dto.fecha }
}

/**
 * Citas con las que choca la que se acaba de guardar. Tolera que `avisos`
 * falte (backend anterior a ADR-11) o que venga sin lista: en ambos casos, [].
 */
export function solapamientosDe(avisos: AvisosCitaDto | null | undefined): AgendaAppointment[] {
  return (avisos?.solapamientos ?? []).map(toAgendaAppointment)
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
 * Tope del rango de `GET /citas?desde&hasta`, inclusivo: seis semanas, lo que
 * ocupa la grilla de un mes. Espejo de `MAX_DIAS_RANGO` del backend (mismo
 * patrón que DTF-06): si el backend lo cambia, se cambia aquí.
 */
export const MAX_DIAS_RANGO = 42

/**
 * GET /citas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD — agenda del profesional por
 * rango de días calendario de la clínica (inclusivo, máx. `MAX_DIAS_RANGO`).
 *
 * Se mandan FECHAS, no instantes: el backend resuelve las medianoches en la
 * zona de la clínica. Todos los estados, ordenada por `inicio` (el front no
 * reordena). 400 si el rango es inválido.
 */
export async function getAppointmentsInRange(
  desde: string,
  hasta: string,
): Promise<AgendaAppointment[]> {
  const query = new URLSearchParams({ desde, hasta })
  const dtos = await http.get<CitaAgendaDto[]>(`/citas?${query.toString()}`)
  return dtos.map(toAgendaAppointment)
}

/**
 * GET /citas/:id — detalle con datos de contacto del paciente y las acciones
 * que el backend declara legales. 404 si no existe o es de otra organización.
 */
export async function getAppointment(id: string): Promise<AppointmentDetail> {
  const dto = await http.get<CitaDetalleDto>(`/citas/${encodeURIComponent(id)}`)
  return toAppointmentDetail(dto)
}
