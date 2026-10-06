import { defineStore } from 'pinia'
import { ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { getAppointmentsInRange } from '../api/appointmentApi'
import type { AgendaAppointment } from './types'

/** Traduce el fallo de la carga a un texto para la agenda. */
function mensajeDeCarga(e: unknown): string {
  if (e instanceof HttpError) {
    if (e.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    // El rango se valida antes de pedirlo; si llega un 400, front y DTO se desalinearon.
    if (e.status === 400) return 'El rango de fechas no es válido.'
  }
  return 'No pudimos cargar tu agenda.'
}

/**
 * Agenda del profesional logueado en un rango de días (`GET /citas?desde&hasta`).
 *
 * Mismo criterio que `useTodayAppointments`: la página compone (escucha los
 * eventos de crear, reagendar y cancelar) y llama a `reload()`. Refrescar =
 * volver a pedir el rango, nunca parchear el arreglo local: el backend decide
 * en qué día cae cada cita en la zona de la clínica y en qué orden van.
 *
 * El rango vive aquí (y no en la página) para que volver a la agenda después
 * de ir a otra vista conserve la semana que se estaba mirando.
 */
export const useAgendaAppointments = defineStore('agendaAppointments', () => {
  const appointments = ref<AgendaAppointment[]>([])
  /** Rango pedido, 'YYYY-MM-DD' inclusivo. Vacío hasta el primer `setRange`. */
  const desde = ref('')
  const hasta = ref('')
  const loading = ref(false)
  /** Ya hubo al menos una carga exitosa (distingue "cargando" de "recargando"). */
  const loaded = ref(false)
  const error = ref<string | null>(null)
  /** Momento de la última carga exitosa: referencia para "cita pasada". */
  const loadedAt = ref<Date>(new Date())

  /** Número de la última petición lanzada: descarta respuestas fuera de orden. */
  let ultimaPeticion = 0
  let ultimoPedidoMs = 0

  async function reload(): Promise<void> {
    if (!desde.value || !hasta.value) return
    const peticion = ++ultimaPeticion
    ultimoPedidoMs = Date.now()
    loading.value = true
    try {
      const lista = await getAppointmentsInRange(desde.value, hasta.value)
      if (peticion !== ultimaPeticion) return
      appointments.value = lista
      loaded.value = true
      loadedAt.value = new Date()
      error.value = null
    } catch (e) {
      if (peticion !== ultimaPeticion) return
      error.value = mensajeDeCarga(e)
    } finally {
      if (peticion === ultimaPeticion) loading.value = false
    }
  }

  /**
   * Cambia el rango y lo pide. Mientras llega, se siguen viendo los datos del
   * rango anterior con el indicador de "Actualizando…" (no se vuelve al
   * esqueleto al navegar de semana).
   *
   * Sin `forzar`, no vuelve a pedir un rango que ya está cargado (cambiar de
   * vista con el mismo rango, por ejemplo). Con `forzar: true` pide siempre: lo
   * usa la agenda al montarse, porque mientras se estaba en otra sección las
   * citas pudieron cambiar (creadas, canceladas o confirmadas desde el dashboard).
   */
  async function setRange(
    nuevoDesde: string,
    nuevoHasta: string,
    opciones: { forzar?: boolean } = {},
  ): Promise<void> {
    const cambio = nuevoDesde !== desde.value || nuevoHasta !== hasta.value
    desde.value = nuevoDesde
    hasta.value = nuevoHasta
    if (opciones.forzar || cambio || !loaded.value) await reload()
  }

  /** Recarga solo si pasó `minIntervalMs` desde el último pedido (volver el foco). */
  async function reloadIfStale(minIntervalMs: number): Promise<void> {
    if (loading.value) return
    if (Date.now() - ultimoPedidoMs < minIntervalMs) return
    await reload()
  }

  return {
    appointments,
    desde,
    hasta,
    loading,
    loaded,
    error,
    loadedAt,
    reload,
    setRange,
    reloadIfStale,
  }
})
