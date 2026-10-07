// Bloques horarios que se ofrecen al elegir una hora, y el horario de atención
// que de ellos se deriva.
//
// Lista única: la leen el modal "Nueva cita", reagendar (voucher), aceptar una
// solicitud (bandeja), el paso Horario del flujo público y la grilla semanal de
// la agenda. Si algún día los bloques se configuran por organización o salen de
// un modelo de disponibilidad, este archivo es el único punto a cambiar.
//
// Decisión del usuario (2026-10-05): bloques de 1 hora con inicios de 07:00 a
// 21:00; la última cita termina a las 22:00. Para cambiar el horario basta con
// tocar las tres constantes de abajo: la lista y el fin de la jornada se
// calculan solos.

/** Inicio más temprano que se ofrece. */
export const PRIMER_BLOQUE = '07:00'
/** Inicio más tardío que se ofrece. */
export const ULTIMO_BLOQUE = '21:00'
/** Largo de un bloque y distancia entre dos inicios seguidos. */
export const DURACION_BLOQUE_MIN = 60

const MINUTOS_DIA = 24 * 60

/** 'HH:mm' → minutos desde la medianoche (NaN si no calza). */
function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) return Number.NaN
  return h * 60 + m
}

/** Minutos desde la medianoche → 'HH:mm' (24:00 o más si pasa de medianoche). */
function aHora(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function generarBloques(): string[] {
  const desde = aMinutos(PRIMER_BLOQUE)
  const hasta = aMinutos(ULTIMO_BLOQUE)
  const bloques: string[] = []
  for (let min = desde; min <= hasta; min += DURACION_BLOQUE_MIN) bloques.push(aHora(min))
  return bloques
}

/** Inicios ofrecidos: '07:00', '08:00', … '21:00'. */
export const BLOQUES_HORARIOS: readonly string[] = generarBloques()

/** Minutos desde la medianoche a los que debe terminar la última cita (22:00 → 1320). */
export const FIN_DE_JORNADA_MIN = Math.min(aMinutos(ULTIMO_BLOQUE) + DURACION_BLOQUE_MIN, MINUTOS_DIA)

/** Hora a la que debe terminar la última cita: el último bloque más su duración ('22:00'). */
export const FIN_DE_JORNADA = aHora(FIN_DE_JORNADA_MIN)

/**
 * Horas enteras que cubre la jornada, para la grilla semanal: de 7 a 22. La
 * agenda las amplía sola si alguna cita cae fuera (citas antiguas o creadas
 * con otro horario).
 */
export const HORAS_JORNADA = {
  desde: Math.floor(aMinutos(PRIMER_BLOQUE) / 60),
  hasta: Math.ceil(FIN_DE_JORNADA_MIN / 60),
} as const

/** Hora de término 'HH:mm' de una cita que empieza a `hora` y dura `duracionMin`. */
export function horaDeTermino(hora: string, duracionMin: number): string {
  return aHora(aMinutos(hora) + duracionMin)
}

/**
 * true si una cita que empieza a `hora` ('HH:mm', la elegida en el
 * formulario) y dura `duracionMin` terminaría después de `FIN_DE_JORNADA`.
 * Con una hora o una duración inválidas devuelve false: eso lo reporta otra regla.
 */
export function terminaDespuesDeLaJornada(hora: string, duracionMin: number): boolean {
  const inicio = aMinutos(hora)
  if (Number.isNaN(inicio) || !Number.isFinite(duracionMin) || duracionMin <= 0) return false
  return inicio + duracionMin > FIN_DE_JORNADA_MIN
}

/**
 * Mensaje de validación para una cita que pasaría del fin de la jornada, o
 * null si cabe. `sugerencia` completa la frase según lo que el formulario deja
 * cambiar (en reagendar la duración no se toca).
 */
export function errorFinDeJornada(
  hora: string,
  duracionMin: number,
  sugerencia = 'Elige una hora más temprana o una duración más corta.',
): string | null {
  if (!terminaDespuesDeLaJornada(hora, duracionMin)) return null
  return `Con ${duracionMin} min, la cita terminaría a las ${horaDeTermino(hora, duracionMin)}. La última cita debe terminar a más tardar a las ${FIN_DE_JORNADA}. ${sugerencia}`
}
