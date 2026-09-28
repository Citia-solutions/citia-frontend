// Lógica pura de la agenda: semanas, rangos, agrupación por día, filtro por
// estado y distribución de citas que se cruzan en la grilla semanal.
//
// Todo trabaja sobre FECHAS 'YYYY-MM-DD' y horas 'HH:mm' tal como las proyecta
// el backend en la zona de la clínica (`fecha`, `hora`). Nada de aquí convierte
// zonas (ADR-07: el backend proyecta, el cliente muestra). La única referencia
// al navegador es "hoy", para elegir la semana inicial y resaltar el día
// (mismo supuesto que DTF-07).
import {
  capitalizar,
  diaDeLaSemana,
  diferenciaDias,
  fechaCalendario,
  minutosDelDia,
  sumarDias,
} from '@/shared/lib/fecha'
import {
  MAX_DIAS_RANGO,
  STATUS_LABEL,
  type AgendaAppointment,
  type AppointmentStatus,
} from '@/entities/appointment'

// ---------------------------------------------------------------------------
// Semanas y rangos
// ---------------------------------------------------------------------------

/** Lunes de la semana que contiene `fecha` (semana lunes–domingo, como en Chile). */
export function inicioDeSemana(fecha: string): string {
  const desdeLunes = (diaDeLaSemana(fecha) + 6) % 7
  return sumarDias(fecha, -desdeLunes)
}

/** Los 7 días de la semana que empieza en `lunes`. */
export function diasDeSemana(lunes: string): string[] {
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
}

const MES = new Intl.DateTimeFormat('es-CL', { month: 'long' })

/** '22 – 28 de septiembre de 2026' · '29 de septiembre – 5 de octubre de 2026'. */
export function etiquetaRango(desde: string, hasta: string): string {
  const a = fechaCalendario(desde)
  const b = fechaCalendario(hasta)
  const mesA = MES.format(a)
  const mesB = MES.format(b)
  if (a.getFullYear() !== b.getFullYear()) {
    return `${a.getDate()} de ${mesA} de ${a.getFullYear()} – ${b.getDate()} de ${mesB} de ${b.getFullYear()}`
  }
  if (mesA !== mesB) {
    return `${a.getDate()} de ${mesA} – ${b.getDate()} de ${mesB} de ${b.getFullYear()}`
  }
  return `${a.getDate()} – ${b.getDate()} de ${mesB} de ${b.getFullYear()}`
}

const DIA_CORTO = new Intl.DateTimeFormat('es-CL', { weekday: 'short' })

/** Encabezado de columna: { nombre: 'Lun', numero: 22 }. */
export function encabezadoDia(fecha: string): { nombre: string; numero: number } {
  const d = fechaCalendario(fecha)
  return { nombre: capitalizar(DIA_CORTO.format(d).replace('.', '')), numero: d.getDate() }
}

/**
 * Valida un rango de la vista lista con las mismas reglas que el backend
 * (`RangoFechasInvalidoError`), para no gastar el viaje en un 400.
 */
export function validarRango(desde: string, hasta: string): string | null {
  if (!desde || !hasta) return 'Elige las dos fechas del rango.'
  let dias: number
  try {
    dias = diferenciaDias(desde, hasta)
  } catch {
    return 'Alguna de las fechas no es válida.'
  }
  if (dias < 0) return 'La fecha "hasta" debe ser igual o posterior a "desde".'
  if (dias + 1 > MAX_DIAS_RANGO) return `El rango máximo es de ${MAX_DIAS_RANGO} días.`
  return null
}

// ---------------------------------------------------------------------------
// Filtro por estado (en el cliente: el endpoint trae todos los estados)
// ---------------------------------------------------------------------------

export type FiltroEstado = 'todos' | 'vigentes' | AppointmentStatus

const VIGENTES: ReadonlySet<AppointmentStatus> = new Set(['pendiente', 'confirmada'])

export const OPCIONES_FILTRO: { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos los estados' },
  { valor: 'vigentes', etiqueta: 'Vigentes (pendientes y confirmadas)' },
  ...(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((estado) => ({
    valor: estado as FiltroEstado,
    etiqueta: STATUS_LABEL[estado],
  })),
]

export function aplicarFiltro(
  citas: AgendaAppointment[],
  filtro: FiltroEstado,
): AgendaAppointment[] {
  if (filtro === 'todos') return citas
  if (filtro === 'vigentes') return citas.filter((c) => VIGENTES.has(c.status))
  return citas.filter((c) => c.status === filtro)
}

// ---------------------------------------------------------------------------
// Agrupación
// ---------------------------------------------------------------------------

/**
 * Agrupa por `date` (la `fecha` del backend) conservando el orden en que vino
 * la lista (`inicio ASC`): el front no reordena.
 */
export function agruparPorFecha(citas: AgendaAppointment[]): Map<string, AgendaAppointment[]> {
  const grupos = new Map<string, AgendaAppointment[]>()
  for (const cita of citas) {
    const grupo = grupos.get(cita.date)
    if (grupo) grupo.push(cita)
    else grupos.set(cita.date, [cita])
  }
  return grupos
}

// ---------------------------------------------------------------------------
// Grilla semanal: citas que se cruzan, lado a lado
// ---------------------------------------------------------------------------

const MINUTOS_DIA = 24 * 60

/** Una cita posicionada en su columna del día. */
export interface BloqueAgenda {
  cita: AgendaAppointment
  /** Minutos desde la medianoche (de `hora`, zona de la clínica). */
  inicioMin: number
  /** Fin para dibujar, recortado a la medianoche (la cita puede seguir al otro día). */
  finMin: number
  /** Carril que ocupa dentro de su grupo de citas que se cruzan (0..carriles-1). */
  carril: number
  carriles: number
}

/**
 * Reparte las citas de UN día en carriles para que las que se cruzan se vean
 * lado a lado en vez de encimadas (con ADR-11 los cruces están permitidos).
 * Mismo criterio de cruce que el backend: intervalos semiabiertos, así que dos
 * citas pegadas (10:00–10:50 y 10:50–11:40) no comparten grupo.
 */
export function distribuirEnCarriles(citas: AgendaAppointment[]): BloqueAgenda[] {
  const items = citas
    .map((cita) => {
      const inicioMin = minutosDelDia(cita.time)
      return {
        cita,
        inicioMin,
        finMin: Math.min(inicioMin + Math.max(cita.durationMin, 1), MINUTOS_DIA),
      }
    })
    .filter((b) => !Number.isNaN(b.inicioMin))
    .sort((a, b) => a.inicioMin - b.inicioMin) // estable: respeta el orden del backend

  const bloques: BloqueAgenda[] = []
  let grupo: BloqueAgenda[] = []
  let finDeCarril: number[] = []
  let finDelGrupo = -1

  const cerrarGrupo = (): void => {
    for (const b of grupo) b.carriles = finDeCarril.length
    grupo = []
    finDeCarril = []
    finDelGrupo = -1
  }

  for (const item of items) {
    if (grupo.length > 0 && item.inicioMin >= finDelGrupo) cerrarGrupo()
    let carril = finDeCarril.findIndex((fin) => fin <= item.inicioMin)
    if (carril === -1) {
      carril = finDeCarril.length
      finDeCarril.push(item.finMin)
    } else {
      finDeCarril[carril] = item.finMin
    }
    const bloque: BloqueAgenda = { ...item, carril, carriles: 1 }
    grupo.push(bloque)
    bloques.push(bloque)
    finDelGrupo = Math.max(finDelGrupo, item.finMin)
  }
  cerrarGrupo()

  return bloques
}

/** Horas que muestra la grilla: 08–20 por defecto, ampliadas si alguna cita cae fuera. */
export function rangoDeHoras(
  bloques: BloqueAgenda[],
  porDefecto: { desde: number; hasta: number } = { desde: 8, hasta: 20 },
): { desde: number; hasta: number } {
  let desde = porDefecto.desde
  let hasta = porDefecto.hasta
  for (const b of bloques) {
    desde = Math.min(desde, Math.floor(b.inicioMin / 60))
    hasta = Math.max(hasta, Math.ceil(b.finMin / 60))
  }
  return { desde, hasta: Math.min(hasta, 24) }
}
