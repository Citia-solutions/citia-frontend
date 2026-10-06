// Utilidades de fecha y hora, sin librerías.
//
// Hay dos clases de dato y no se mezclan:
//
// - **Instantes** (`Date`, o un ISO con zona como el `inicio` del backend). Se
//   muestran y se arman SIEMPRE en la zona de la clínica (`ZONA_HORARIA`,
//   America/Santiago en el MVP), nunca en la del navegador: una cita "10:00" es
//   a las 10:00 de Chile aunque el panel se abra desde otra zona (DTF-07,
//   cerrada el 2026-10-06). Nada de este archivo usa `getHours()`, `getDate()`
//   ni `new Date(año, mes, día)`, que dependen de la zona del navegador.
// - **Días calendario** ('YYYY-MM-DD'), como la `fecha` que proyecta el backend.
//   Se cuentan, se suman y se formatean sin convertir zonas.
import { LOCALE_FECHAS, ZONA_HORARIA } from '@/shared/config/zonaHoraria'

const DIA_MS = 86_400_000

/** Rellena con cero a la izquierda hasta dos dígitos. */
function dosDigitos(n: number): string {
  return String(n).padStart(2, '0')
}

// ---------------------------------------------------------------------------
// Instantes en la zona de la clínica
// ---------------------------------------------------------------------------

interface PartesEnZona {
  anio: number
  mes: number // 1–12
  dia: number
  hora: number // 0–23
  minuto: number
  segundo: number
}

// Solo se leen las partes numéricas (`formatToParts`): el locale da igual.
const FORMATO_PARTES = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
})

/** Lo que marca el reloj de la clínica en ese instante. */
function partesEnZona(instante: Date): PartesEnZona {
  const valores: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {}
  for (const parte of FORMATO_PARTES.formatToParts(instante)) {
    if (parte.type !== 'literal') valores[parte.type] = Number(parte.value)
  }
  return {
    anio: valores.year ?? Number.NaN,
    mes: valores.month ?? Number.NaN,
    dia: valores.day ?? Number.NaN,
    // Algún motor antiguo da "24" a la medianoche aun con `h23`.
    hora: (valores.hour ?? Number.NaN) % 24,
    minuto: valores.minute ?? Number.NaN,
    segundo: valores.second ?? Number.NaN,
  }
}

/** Desfase de la zona de la clínica respecto de UTC en ese instante (ms; −3 h → −10 800 000). */
function desfaseMs(instanteMs: number): number {
  const p = partesEnZona(new Date(instanteMs))
  const comoUTC = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo)
  return comoUTC - Math.floor(instanteMs / 1000) * 1000
}

/**
 * Instante (ms) en que el reloj de la clínica marca esa fecha y hora.
 *
 * Seguro ante el cambio de horario: prueba el desfase de un día antes y el de
 * un día después (los dos lados de un cambio cercano) y se queda con el que
 * calza. Los casos raros se resuelven como `Temporal` con
 * `disambiguation: 'compatible'`:
 * - hora repetida (al volver al horario de invierno, la última hora del sábado
 *   se vive dos veces): la primera;
 * - hora inexistente (al pasar al de verano, la primera hora del domingo no
 *   existe): se corre hacia adelante lo que dura el salto (00:30 → 01:30).
 * Los bloques de la agenda (07:00–21:00) nunca caen ahí.
 */
function instanteEnZona(anio: number, mes: number, dia: number, horas: number, minutos: number): number {
  const ingenuo = Date.UTC(anio, mes - 1, dia, horas, minutos)
  const desfaseAntes = desfaseMs(ingenuo - DIA_MS)
  const desfaseDespues = desfaseMs(ingenuo + DIA_MS)
  const validos = [desfaseAntes, desfaseDespues]
    .map((desfase) => ingenuo - desfase)
    .filter((instante) => desfaseMs(instante) === ingenuo - instante)
  if (validos.length > 0) return Math.min(...validos)
  // Hora inexistente: con el desfase de antes del salto cae justo después de él.
  return ingenuo - desfaseAntes
}

/**
 * Combina fecha ('YYYY-MM-DD') y hora ('HH:mm') —lo que se eligió en un
 * formulario— en un instante ISO con zona explícita, leyéndolas como hora de
 * la clínica: '2026-08-25' + '10:00' → '2026-08-25T14:00:00.000Z' (Chile en
 * invierno, −04). El resultado no depende de la zona del navegador.
 *
 * `toISOString()` lo serializa terminado en `Z` (desfase explícito +00:00, que
 * es lo que pide DT-14: nunca sin zona). El backend guarda instantes y
 * proyecta a la zona de la clínica al mostrar.
 */
export function aInicioISO(fecha: string, hora: string): string {
  const partesFecha = fecha.split('-')
  const partesHora = hora.split(':')

  const anio = Number(partesFecha[0])
  const mes = Number(partesFecha[1])
  const dia = Number(partesFecha[2])
  const horas = Number(partesHora[0])
  const minutos = Number(partesHora[1])

  if ([anio, mes, dia, horas, minutos].some(Number.isNaN)) {
    throw new Error(`Fecha u hora con formato inesperado: "${fecha}" "${hora}"`)
  }

  return new Date(instanteEnZona(anio, mes, dia, horas, minutos)).toISOString()
}

/**
 * true si una cita que empieza el día `fecha` a la hora `hora` (hora de la
 * clínica) ya empezó: inicio igual o anterior a `ahora`. Con un formato
 * inválido devuelve false: eso lo reporta otra regla.
 */
export function esInicioPasado(fecha: string, hora: string, ahora: Date = new Date()): boolean {
  try {
    return new Date(aInicioISO(fecha, hora)).getTime() <= ahora.getTime()
  } catch {
    return false
  }
}

/**
 * Día 'YYYY-MM-DD' de un instante en la zona de la clínica. Ojo:
 * `toISOString().slice(0, 10)` da la fecha UTC, que en Chile de noche ya es
 * "mañana". Con `new Date()` da "hoy".
 */
export function fechaEnClinicaISO(instante: Date): string {
  const p = partesEnZona(instante)
  return `${p.anio}-${dosDigitos(p.mes)}-${dosDigitos(p.dia)}`
}

/** Hora 'HH:mm' de un instante en la zona de la clínica. */
export function horaEnClinica(instante: Date): string {
  const p = partesEnZona(instante)
  return `${dosDigitos(p.hora)}:${dosDigitos(p.minuto)}`
}

/** true si la fecha 'YYYY-MM-DD' es anterior a hoy (hoy en la zona de la clínica). */
export function esDiaPasado(fechaISO: string, ahora: Date = new Date()): boolean {
  return fechaISO < fechaEnClinicaISO(ahora)
}

/** true si ambos instantes caen el mismo día calendario en la zona de la clínica. */
export function esMismoDia(a: Date, b: Date): boolean {
  return fechaEnClinicaISO(a) === fechaEnClinicaISO(b)
}

/** Suma minutos a un instante. */
export function sumarMinutos(fecha: Date, minutos: number): Date {
  return new Date(fecha.getTime() + minutos * 60_000)
}

// ---------------------------------------------------------------------------
// Formateo (español de Chile, zona de la clínica)
// ---------------------------------------------------------------------------

type OpcionesFormato = Omit<Intl.DateTimeFormatOptions, 'timeZone'>

const formatos = new Map<string, Intl.DateTimeFormat>()

/**
 * Formatea un instante con las opciones de `Intl`, siempre en `es-CL` y en la
 * zona de la clínica (la zona no se puede pisar). Sirve también para un día de
 * `fechaCalendario`. Los formateadores se reutilizan por opciones.
 */
export function formatearFecha(fecha: Date, opciones: OpcionesFormato): string {
  const clave = JSON.stringify(opciones)
  let formato = formatos.get(clave)
  if (!formato) {
    formato = new Intl.DateTimeFormat(LOCALE_FECHAS, { ...opciones, timeZone: ZONA_HORARIA })
    formatos.set(clave, formato)
  }
  return formato.format(fecha)
}

/** 'martes, 23 de septiembre' (zona de la clínica). */
export function formatearFechaLarga(fecha: Date): string {
  return formatearFecha(fecha, { weekday: 'long', day: 'numeric', month: 'long' })
}

/**
 * 'mar, 14 oct · 10:30' (zona de la clínica). Versión compacta de fecha + hora
 * para listas donde la fecha larga no cabe (p. ej. los recordatorios del
 * voucher).
 */
export function formatearMomentoCorto(fecha: Date): string {
  const dia = formatearFecha(fecha, { weekday: 'short', day: 'numeric', month: 'short' })
  return `${dia} · ${horaEnClinica(fecha)}`
}

/** Primera letra en mayúscula: 'martes 23…' → 'Martes 23…'. */
export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// ---------------------------------------------------------------------------
// Días calendario ('YYYY-MM-DD'). Son FECHAS, no instantes: la agenda las recibe
// ya proyectadas a la zona de la clínica (`fecha` de `CitaDashboardDto`) y aquí
// solo se cuentan, se suman y se formatean. Nada de esto convierte zonas: la
// aritmética va en UTC, que no tiene cambios de horario.
// ---------------------------------------------------------------------------

/** Descompone 'YYYY-MM-DD' en [año, mes 1–12, día]; lanza si el formato no calza. */
export function partesDeFecha(fechaISO: string): [number, number, number] {
  const partes = fechaISO.split('-').map(Number)
  const [anio, mes, dia] = partes
  if (
    partes.length !== 3 ||
    anio === undefined ||
    mes === undefined ||
    dia === undefined ||
    partes.some(Number.isNaN)
  ) {
    throw new Error(`Fecha con formato inesperado: "${fechaISO}"`)
  }
  return [anio, mes, dia]
}

/** Arma 'YYYY-MM-DD', o null si ese día no existe (31 de septiembre, 29 de febrero de 2027). */
export function aFechaISO(anio: number, mes: number, dia: number): string | null {
  const d = new Date(Date.UTC(anio, mes - 1, dia))
  if (d.getUTCFullYear() !== anio || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null
  return `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}`
}

/** Cuántos días tiene el mes (`mes` 1–12). */
export function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate()
}

/**
 * 'YYYY-MM-DD' → Date a MEDIODÍA UTC de ese día, solo para formatearlo con
 * `formatearFechaLarga` / `formatearFecha`: en la zona de la clínica (UTC−3 o
 * UTC−4) sigue siendo ese mismo día, sea cual sea la zona del navegador.
 * (`new Date('2026-09-22')` sería medianoche UTC: en Chile, el día anterior.)
 * Sus partes no se leen con `getDate()` & cía.: para eso está `partesDeFecha`.
 */
export function fechaCalendario(fechaISO: string): Date {
  const [anio, mes, dia] = partesDeFecha(fechaISO)
  return new Date(Date.UTC(anio, mes - 1, dia, 12))
}

/** Suma días a una fecha calendario (aritmética en UTC: ningún cambio de horario la corre). */
export function sumarDias(fechaISO: string, dias: number): string {
  const [anio, mes, dia] = partesDeFecha(fechaISO)
  const d = new Date(Date.UTC(anio, mes - 1, dia + dias))
  return `${d.getUTCFullYear()}-${dosDigitos(d.getUTCMonth() + 1)}-${dosDigitos(d.getUTCDate())}`
}

/** Días de `desde` a `hasta` (negativo si `hasta` es anterior). */
export function diferenciaDias(desde: string, hasta: string): number {
  const [a1, m1, d1] = partesDeFecha(desde)
  const [a2, m2, d2] = partesDeFecha(hasta)
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / DIA_MS)
}

/** Día de la semana de una fecha calendario: 0 = domingo … 6 = sábado. */
export function diaDeLaSemana(fechaISO: string): number {
  const [anio, mes, dia] = partesDeFecha(fechaISO)
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()
}

/**
 * Lunes de la semana que contiene `fecha` (semana lunes–domingo, como en
 * Chile). La usan la agenda (semana visible) y el dashboard (citas por semana).
 */
export function inicioDeSemana(fechaISO: string): string {
  const desdeLunes = (diaDeLaSemana(fechaISO) + 6) % 7
  return sumarDias(fechaISO, -desdeLunes)
}

/** 'HH:mm' → minutos desde la medianoche (NaN si no calza). */
export function minutosDelDia(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  if (h === undefined || m === undefined) return Number.NaN
  return h * 60 + m
}
