// Lógica pura del resumen del dashboard: rangos que se piden, próxima cita,
// conteos y citas por semana. Nada inventado: todo sale de las citas que
// devuelve el backend (`GET /citas/hoy` y `GET /citas?desde&hasta`).
//
// Vocabulario (el mismo que el subtítulo del topbar y `useTodayAppointments`):
// - **agendada** = cualquier cita que no esté cancelada (incluye las que ya
//   quedaron como asistió / no asistió: siguen siendo citas de ese día);
// - **vigente** = `pendiente` o `confirmada` (`isActiveStatus`), el criterio del
//   backend. Solo se usa para "próxima cita".
//
// Las fechas son días 'YYYY-MM-DD'. "Hoy" sale de la zona del navegador
// (DTF-07); el día de cada cita, de la `fecha` del backend (ADR-07).
import { diferenciaDias, fechaCalendario, inicioDeSemana, sumarDias } from '@/shared/lib/fecha'
import {
  isActiveStatus,
  type AgendaAppointment,
  type Appointment,
} from '@/entities/appointment'

export interface RangoDias {
  /** 'YYYY-MM-DD', inclusivo. */
  desde: string
  /** 'YYYY-MM-DD', inclusivo. */
  hasta: string
}

/** Días de la tarjeta "Próximos 7 días", contando hoy (como el atajo de la agenda). */
export const DIAS_PROXIMOS = 7

/**
 * Semanas del gráfico "Citas por semana": 6 semanas lunes–domingo, la actual
 * incluida. 6 × 7 = 42 días, justo el tope de `GET /citas` (`MAX_DIAS_RANGO`):
 * un solo pedido.
 */
export const SEMANAS_HISTORIAL = 6

/** Hoy y los `dias - 1` siguientes. */
export function rangoProximosDias(hoy: string, dias: number = DIAS_PROXIMOS): RangoDias {
  return { desde: hoy, hasta: sumarDias(hoy, dias - 1) }
}

/** Del lunes de hace `semanas - 1` semanas al domingo de la semana actual. */
export function rangoUltimasSemanas(hoy: string, semanas: number = SEMANAS_HISTORIAL): RangoDias {
  const lunesActual = inicioDeSemana(hoy)
  return { desde: sumarDias(lunesActual, -7 * (semanas - 1)), hasta: sumarDias(lunesActual, 6) }
}

/** true si la cita cuenta como agendada: todo menos `cancelada`. */
export function esAgendada(cita: Appointment): boolean {
  return cita.status !== 'cancelada'
}

/**
 * Primera cita vigente que empieza después de `ahora`. La lista viene ordenada
 * por `inicio` desde el backend: no se reordena.
 */
export function proximaCita<T extends Appointment>(citas: readonly T[], ahora: Date): T | null {
  const ms = ahora.getTime()
  return (
    citas.find((c) => isActiveStatus(c.status) && new Date(c.startsAt).getTime() > ms) ?? null
  )
}

export interface TotalesCitas {
  /** Citas agendadas (no canceladas). */
  agendadas: number
  /** Suma de `duracionMin` de esas citas. */
  minutos: number
}

/** Cuántas citas agendadas hay y cuánto tiempo suman. */
export function totalesDeCitas(citas: readonly Appointment[]): TotalesCitas {
  let agendadas = 0
  let minutos = 0
  for (const c of citas) {
    if (!esAgendada(c)) continue
    agendadas += 1
    minutos += c.durationMin
  }
  return { agendadas, minutos }
}

/** 390 → '6 h 30 min' · 120 → '2 h' · 45 → '45 min' · 0 → '0 min'. */
export function formatearDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** plural(1, 'cita') → '1 cita' · plural(3, 'cita') → '3 citas'. */
export function plural(n: number, singular: string, enPlural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : enPlural}`
}

// ---------------------------------------------------------------------------
// Citas por semana
// ---------------------------------------------------------------------------

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** '2026-09-22' → '22 sep'. */
function diaMesCorto(fecha: string): string {
  const d = fechaCalendario(fecha)
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()] ?? ''}`
}

export interface SemanaCitas {
  /** Lunes de la semana, 'YYYY-MM-DD'. */
  lunes: string
  /** Etiqueta bajo la barra: 'Esta semana' o '22 sep' (el lunes). */
  etiqueta: string
  /** Para lectores de pantalla y el tooltip: 'Semana del 22 al 28 sep'. */
  titulo: string
  agendadas: number
  canceladas: number
  esActual: boolean
}

/**
 * Cuenta las citas de cada semana lunes–domingo desde `lunesInicial`, por la
 * `fecha` del backend. Una cita fuera del rango (no debería venir) se ignora.
 */
export function citasPorSemana(
  citas: readonly AgendaAppointment[],
  lunesInicial: string,
  hoy: string,
  semanas: number = SEMANAS_HISTORIAL,
): SemanaCitas[] {
  const lunesActual = inicioDeSemana(hoy)
  const resultado: SemanaCitas[] = Array.from({ length: semanas }, (_, i) => {
    const lunes = sumarDias(lunesInicial, 7 * i)
    const esActual = lunes === lunesActual
    return {
      lunes,
      etiqueta: esActual ? 'Esta semana' : diaMesCorto(lunes),
      titulo: `${esActual ? 'Esta semana' : 'Semana'} (${diaMesCorto(lunes)} – ${diaMesCorto(sumarDias(lunes, 6))})`,
      agendadas: 0,
      canceladas: 0,
      esActual,
    }
  })

  for (const cita of citas) {
    let indice: number
    try {
      indice = Math.floor(diferenciaDias(lunesInicial, cita.date) / 7)
    } catch {
      continue
    }
    const semana = resultado[indice]
    if (!semana) continue
    if (esAgendada(cita)) semana.agendadas += 1
    else semana.canceladas += 1
  }
  return resultado
}
