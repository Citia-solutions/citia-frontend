import { onScopeDispose, ref } from 'vue'
import type { Appointment } from '@/entities/appointment'
import { getRecordatoriosDeCita, type Recordatorio } from '@/entities/recordatorio'
import { statusDe } from './mensajeDeError'

/**
 * Espera entre reintentos mientras el backend procesa el evento de la cita.
 * Los recordatorios se programan de forma asíncrona (outbox, ~5 s): justo
 * después de crear, reagendar o cancelar, la lista puede venir vacía o vieja.
 */
export const ESPERA_REINTENTO_MS = 2_500
/** Reintentos como máximo: con la espera de arriba cubren ~10 s. */
export const MAX_REINTENTOS = 4
/**
 * Margen mínimo del backend (`RECORDATORIO_MARGEN_MINIMO_MIN`, 30): a una cita
 * que empieza antes de eso no se le programa nada. Solo decide si "lista
 * vacía" es raro (vale la pena reintentar) o esperable.
 */
const MARGEN_MINIMO_MS = 30 * 60_000

/** Condición que la lista debería cumplir; mientras no, se reintenta. */
export type CondicionRecordatorios = (lista: Recordatorio[]) => boolean

/**
 * true si la cita debería tener recordatorios: vigente y con más de 30 min por
 * delante. Si además los recordatorios están desactivados, el backend no
 * programa nada, pero eso el voucher no lo sabe (es configuración del dueño).
 */
export function deberiaTenerRecordatorios(cita: Pick<Appointment, 'status' | 'startsAt'>): boolean {
  if (cita.status !== 'pendiente' && cita.status !== 'confirmada') return false
  return new Date(cita.startsAt).getTime() - MARGEN_MINIMO_MS > Date.now()
}

/** Condición tras abrir el voucher: que haya al menos uno. */
export const hayAlguno: CondicionRecordatorios = (lista) => lista.length > 0

/** Condición tras cancelar: que no quede ninguno `programado`. */
export const ningunoProgramado: CondicionRecordatorios = (lista) =>
  !lista.some((r) => r.estado === 'programado')

/**
 * Condición tras reagendar: los que estaban `programado` ya no lo están (el
 * backend los anula como `reprogramado`) y, si la nueva hora admite
 * recordatorios, aparecieron los nuevos.
 */
export function reprogramados(
  antes: Recordatorio[],
  esperaNuevos: boolean,
): CondicionRecordatorios {
  const idsAntes = new Set(antes.map((r) => r.id))
  const programadosAntes = new Set(antes.filter((r) => r.estado === 'programado').map((r) => r.id))
  return (lista) => {
    const viejosResueltos = !lista.some((r) => programadosAntes.has(r.id) && r.estado === 'programado')
    const hayNuevos = lista.some((r) => !idsAntes.has(r.id))
    return viejosResueltos && (hayNuevos || !esperaNuevos)
  }
}

function mensajeDeCarga(e: unknown): string {
  switch (statusDe(e)) {
    case null:
      return 'No pudimos conectar con el servidor.'
    case 401:
      return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    case 404:
      return 'Esta cita ya no está disponible.'
    default:
      return 'No pudimos cargar los recordatorios.'
  }
}

/**
 * Recordatorios de la cita abierta en el voucher
 * (`GET /citas/:citaId/recordatorios`).
 *
 * Como el backend los programa de forma asíncrona, `cargar` acepta una
 * condición: si la respuesta no la cumple, vuelve a pedir cada
 * `ESPERA_REINTENTO_MS` hasta `MAX_REINTENTOS` veces, con `esperando = true`
 * para que la vista diga "programando…" en vez de "no hay". Agotados los
 * reintentos se muestra lo último que llegó.
 *
 * Mismo cuidado que `useDetalleCita`: una respuesta de una cita anterior o de
 * un pedido superado se descarta.
 */
export function useRecordatoriosCita() {
  const recordatorios = ref<Recordatorio[]>([])
  const loading = ref(false)
  /** Ya llegó al menos una respuesta para la cita actual. */
  const loaded = ref(false)
  const error = ref<string | null>(null)
  /** Hay reintentos en curso esperando que el backend termine de programar. */
  const esperando = ref(false)

  let ultimaPeticion = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  function detenerReintentos(): void {
    clearTimeout(timer)
    timer = undefined
    esperando.value = false
  }

  function reset(): void {
    ultimaPeticion += 1
    detenerReintentos()
    recordatorios.value = []
    loading.value = false
    loaded.value = false
    error.value = null
  }

  async function pedir(
    citaId: string,
    hasta: CondicionRecordatorios | null,
    intento: number,
  ): Promise<void> {
    const peticion = ++ultimaPeticion
    loading.value = true
    try {
      const lista = await getRecordatoriosDeCita(citaId)
      if (peticion !== ultimaPeticion) return
      recordatorios.value = lista
      loaded.value = true
      error.value = null
      if (hasta && !hasta(lista) && intento < MAX_REINTENTOS) {
        esperando.value = true
        timer = setTimeout(() => void pedir(citaId, hasta, intento + 1), ESPERA_REINTENTO_MS)
      } else {
        esperando.value = false
      }
    } catch (e) {
      if (peticion !== ultimaPeticion) return
      error.value = mensajeDeCarga(e)
      esperando.value = false
    } finally {
      if (peticion === ultimaPeticion) loading.value = false
    }
  }

  /**
   * Pide la lista de la cita. Con `hasta`, reintenta mientras la lista no
   * cumpla la condición (ver `hayAlguno`, `ningunoProgramado`, `reprogramados`).
   * Cancela cualquier reintento pendiente de una carga anterior.
   */
  function cargar(citaId: string, hasta: CondicionRecordatorios | null = null): Promise<void> {
    clearTimeout(timer)
    timer = undefined
    return pedir(citaId, hasta, 0)
  }

  onScopeDispose(() => clearTimeout(timer))

  return { recordatorios, loading, loaded, error, esperando, reset, cargar, detenerReintentos }
}
