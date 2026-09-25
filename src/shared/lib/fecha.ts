// Utilidades de fecha y hora, sin librerías.
//
// Supuesto a tener presente: todo lo de este archivo usa la zona del
// NAVEGADOR, y el backend proyecta con la zona de la CLÍNICA. Coinciden
// mientras el profesional trabaje desde Chile; si alguna vez no coinciden,
// crear y reagendar se desfasan igual (se registra como deuda, no se resuelve aquí).

/** Rellena con cero a la izquierda hasta dos dígitos. */
function dosDigitos(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Combina fecha ('YYYY-MM-DD') y hora ('HH:mm') en un instante ISO con zona
 * explícita.
 *
 * Se construye con componentes locales (`new Date(a, m, d, h, min)`) a
 * propósito: si se pasara la cadena `'2026-08-25T14:00'` el navegador la
 * interpretaría como UTC y la cita quedaría corrida varias horas. Al armarla
 * por componentes se usa la zona del navegador —la del profesional— y
 * `toISOString()` la serializa como instante absoluto terminado en `Z`
 * (desfase explícito +00:00, que es lo que pide DT-14: nunca sin zona).
 *
 * El backend guarda instantes y proyecta a la zona de la clínica al mostrar,
 * así que mandar el instante explícito es exactamente lo que espera.
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

  return new Date(anio, mes - 1, dia, horas, minutos, 0, 0).toISOString()
}

/**
 * Fecha 'YYYY-MM-DD' en zona LOCAL. Ojo: `toISOString().slice(0, 10)` da la
 * fecha UTC, que en Chile de noche ya es "mañana".
 */
export function fechaLocalISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`
}

/** Hora 'HH:mm' en zona local. */
export function horaLocal(fecha: Date): string {
  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
}

/** true si la fecha 'YYYY-MM-DD' es anterior a hoy (en zona local). */
export function esDiaPasado(fechaISO: string, ahora: Date = new Date()): boolean {
  return fechaISO < fechaLocalISO(ahora)
}

/** true si ambos instantes caen el mismo día calendario (zona local). */
export function esMismoDia(a: Date, b: Date): boolean {
  return fechaLocalISO(a) === fechaLocalISO(b)
}

/** Suma minutos a un instante. */
export function sumarMinutos(fecha: Date, minutos: number): Date {
  return new Date(fecha.getTime() + minutos * 60_000)
}

/** 'martes 23 de septiembre' (zona local, español de Chile). */
export function formatearFechaLarga(fecha: Date): string {
  return fecha.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** Primera letra en mayúscula: 'martes 23…' → 'Martes 23…'. */
export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
