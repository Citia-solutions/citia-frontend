// Calendario del paso Horario del flujo público: qué meses se pueden recorrer y
// qué días tiene cada uno. Lógica pura sobre días 'YYYY-MM-DD'; "hoy" lo pone
// quien llama, en la zona de la clínica (`fechaEnClinicaISO`).
import { aFechaISO, diaDeLaSemana, diasDelMes, partesDeFecha } from '@/shared/lib/fecha'

/**
 * Cuántos meses después del actual se pueden ver en el calendario público: el
 * mes en curso y los 3 siguientes. Hacia atrás no se navega (los días pasados
 * no se pueden elegir). Más allá de unos meses una preferencia de hora pierde
 * sentido: el profesional fija la hora real al aceptar la solicitud.
 */
export const MESES_HACIA_ADELANTE = 3

/** Un mes del calendario (`mes` 1–12). */
export interface MesCalendario {
  anio: number
  mes: number
}

/** Una celda con día; `null` es un hueco antes del día 1. */
export type CeldaCalendario = { iso: string; numero: number } | null

/** Mes que contiene el día 'YYYY-MM-DD'. */
export function mesDe(fechaISO: string): MesCalendario {
  const [anio, mes] = partesDeFecha(fechaISO)
  return { anio, mes }
}

/** `desde` más `meses` meses (negativo para ir hacia atrás). */
export function sumarMeses(desde: MesCalendario, meses: number): MesCalendario {
  const indice = desde.anio * 12 + (desde.mes - 1) + meses
  return { anio: Math.floor(indice / 12), mes: (((indice % 12) + 12) % 12) + 1 }
}

/** Días del mes en una grilla lunes–domingo: primero los huecos hasta el día 1. */
export function celdasDelMes({ anio, mes }: MesCalendario): CeldaCalendario[] {
  const dias: CeldaCalendario[] = []
  for (let dia = 1; dia <= diasDelMes(anio, mes); dia += 1) {
    const iso = aFechaISO(anio, mes, dia)
    if (iso) dias.push({ iso, numero: dia })
  }
  const primero = dias[0]
  const huecos = primero ? (diaDeLaSemana(primero.iso) + 6) % 7 : 0 // semana desde el lunes
  return [...Array.from({ length: huecos }, () => null), ...dias]
}
