// Lógica pura de la agenda: semanas, rangos, agrupación por día, filtro por
// estado y distribución de citas que se cruzan en la grilla semanal.
//
// Todo trabaja sobre FECHAS 'YYYY-MM-DD' y horas 'HH:mm' tal como las proyecta
// el backend en la zona de la clínica (`fecha`, `hora`). Nada de aquí convierte
// zonas (ADR-07: el backend proyecta, el cliente muestra). La única referencia
// al navegador es "hoy", para elegir la semana inicial y resaltar el día
// (mismo supuesto que DTF-07).
import { HORAS_JORNADA } from '@/shared/config/bloquesHorarios'
import {
  capitalizar,
  diferenciaDias,
  fechaCalendario,
  inicioDeSemana,
  minutosDelDia,
  sumarDias,
} from '@/shared/lib/fecha'
import {
  isActiveStatus,
  MAX_DIAS_RANGO,
  type AgendaAppointment,
  type AppointmentStatus,
} from '@/entities/appointment'

// ---------------------------------------------------------------------------
// Semanas y rangos
// ---------------------------------------------------------------------------

/**
 * Lunes de la semana que contiene `fecha`. Vive en `shared/lib/fecha` (también
 * lo usa el dashboard); se reexporta para no romper a quien lo importaba de aquí.
 */
export { inicioDeSemana }

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

/**
 * `sin_canceladas` (todo menos `cancelada`) es el filtro POR DEFECTO desde el
 * 2026-10-05 (decisión del usuario): las canceladas se consultan con
 * "Canceladas" o "Todos los estados".
 */
export type FiltroEstado = 'sin_canceladas' | 'todos' | 'vigentes' | AppointmentStatus

export const FILTRO_POR_DEFECTO: FiltroEstado = 'sin_canceladas'

/**
 * Opciones del selector. `ghosting` ("Sin respuesta") no se ofrece: ningún
 * flujo produce ese estado (el job de cierre no existe, DT-11). Si alguna vez
 * llega una, se ve con "Sin canceladas" y "Todos los estados".
 */
export const OPCIONES_FILTRO: { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: 'sin_canceladas', etiqueta: 'Sin canceladas' },
  { valor: 'todos', etiqueta: 'Todos los estados' },
  { valor: 'vigentes', etiqueta: 'Vigentes (pendientes y confirmadas)' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'confirmada', etiqueta: 'Confirmadas' },
  { valor: 'asistio', etiqueta: 'Asistieron' },
  { valor: 'no_asistio', etiqueta: 'No asistieron' },
  { valor: 'cancelada', etiqueta: 'Canceladas' },
]

export function aplicarFiltro(
  citas: AgendaAppointment[],
  filtro: FiltroEstado,
): AgendaAppointment[] {
  if (filtro === 'todos') return citas
  if (filtro === 'sin_canceladas') return citas.filter((c) => c.status !== 'cancelada')
  if (filtro === 'vigentes') return citas.filter((c) => isActiveStatus(c.status))
  return citas.filter((c) => c.status === filtro)
}

/**
 * Conteo de un día: "3 citas", "3 citas · 1 cancelada" o "2 canceladas". Las
 * canceladas se cuentan aparte (no son citas a las que haya que ir) y solo si
 * están a la vista: las que oculta el filtro no llegan a esta función.
 */
export function conteoDeCitas(citas: AgendaAppointment[]): string {
  const canceladas = citas.filter((c) => c.status === 'cancelada').length
  const agendadas = citas.length - canceladas
  const partes: string[] = []
  if (agendadas > 0 || canceladas === 0) partes.push(`${agendadas} ${agendadas === 1 ? 'cita' : 'citas'}`)
  if (canceladas > 0) partes.push(`${canceladas} ${canceladas === 1 ? 'cancelada' : 'canceladas'}`)
  return partes.join(' · ')
}

/**
 * Nota para el estado vacío cuando el filtro esconde citas del rango cargado:
 * "2 canceladas ocultas por el filtro." · "3 citas ocultas por el filtro.".
 * null si no hay nada oculto.
 */
export function notaOcultas(
  total: AgendaAppointment[],
  visibles: AgendaAppointment[],
  filtro: FiltroEstado,
): string | null {
  const n = total.length - visibles.length
  if (n <= 0) return null
  if (filtro === 'sin_canceladas') {
    return `${n} ${n === 1 ? 'cancelada oculta' : 'canceladas ocultas'} por el filtro.`
  }
  return `${n} ${n === 1 ? 'cita oculta' : 'citas ocultas'} por el filtro.`
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
  /**
   * true si es una cancelada: va en la capa de FONDO, con carriles propios
   * (solo entre canceladas), y nunca le quita ancho a una cita no cancelada.
   */
  fondo: boolean
}

/**
 * Reparte las citas de UN día en carriles para que las que se cruzan se vean
 * lado a lado en vez de encimadas (con ADR-11 los cruces están permitidos).
 * Mismo criterio de cruce que el backend: intervalos semiabiertos, así que dos
 * citas pegadas (10:00–10:50 y 10:50–11:40) no comparten grupo.
 *
 * Las canceladas NO ocupan carril entre las demás (2026-10-05): una hora
 * cancelada y vuelta a agendar no debe partir la columna en dos. Si el filtro
 * las muestra, se reparten aparte y se dibujan detrás (`fondo: true`); una
 * cancelada tapada por completo se consulta con el filtro "Canceladas" o en la
 * vista lista.
 */
export function distribuirEnCarriles(citas: AgendaAppointment[]): BloqueAgenda[] {
  const canceladas = citas.filter((c) => c.status === 'cancelada')
  const resto = citas.filter((c) => c.status !== 'cancelada')
  // Primero el fondo: así, en el DOM, las no canceladas quedan encima.
  return [...repartir(canceladas, true), ...repartir(resto, false)]
}

function repartir(citas: AgendaAppointment[], fondo: boolean): BloqueAgenda[] {
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
    const bloque: BloqueAgenda = { ...item, carril, carriles: 1, fondo }
    grupo.push(bloque)
    bloques.push(bloque)
    finDelGrupo = Math.max(finDelGrupo, item.finMin)
  }
  cerrarGrupo()

  return bloques
}

/**
 * Horas que muestra la grilla: la jornada de `shared/config/bloquesHorarios`
 * (07–22 desde el 2026-10-05) por defecto, ampliadas si alguna cita cae fuera.
 */
export function rangoDeHoras(
  bloques: BloqueAgenda[],
  porDefecto: { desde: number; hasta: number } = HORAS_JORNADA,
): { desde: number; hasta: number } {
  let desde = porDefecto.desde
  let hasta = porDefecto.hasta
  for (const b of bloques) {
    desde = Math.min(desde, Math.floor(b.inicioMin / 60))
    hasta = Math.max(hasta, Math.ceil(b.finMin / 60))
  }
  return { desde, hasta: Math.min(hasta, 24) }
}
