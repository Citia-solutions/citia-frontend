import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { getTodayAppointments } from '../api/appointmentApi'
import type { Appointment } from './types'

/** Traduce el fallo de la carga a un texto para la tarjeta. */
function mensajeDeCarga(e: unknown): string {
  if (e instanceof HttpError && e.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  }
  return 'No pudimos cargar tus citas de hoy.'
}

/**
 * Citas del día del profesional logueado.
 *
 * La lista la leen varios lugares (la tarjeta "Citas de hoy", su subtítulo y el
 * del topbar) y la invalidan acciones de features distintos (crear, reagendar,
 * cancelar) que en FSD no pueden importarse entre sí. Por eso vive aquí: la
 * página escucha los eventos de los features y llama a `reload()`.
 *
 * Refrescar = volver a pedir `GET /citas/hoy`, nunca parchear el arreglo local:
 * el backend ya resuelve si una cita sigue siendo "de hoy" y su hora en la zona
 * de la clínica. Replicarlo aquí sería reimplementar el backend en el navegador.
 */
export const useTodayAppointments = defineStore('todayAppointments', () => {
  const appointments = ref<Appointment[]>([])
  /** Hay una petición en curso. */
  const loading = ref(false)
  /** Ya hubo al menos una carga exitosa (distingue "cargando" de "recargando"). */
  const loaded = ref(false)
  const error = ref<string | null>(null)
  /** Momento de la última carga exitosa: referencia para "cita pasada". */
  const loadedAt = ref<Date>(new Date())

  /** Número de la última petición lanzada: descarta respuestas fuera de orden. */
  let ultimaPeticion = 0
  /** Momento en que se lanzó la última petición (para `reloadIfStale`). */
  let ultimoPedidoMs = 0

  async function reload(): Promise<void> {
    const peticion = ++ultimaPeticion
    ultimoPedidoMs = Date.now()
    loading.value = true
    try {
      const lista = await getTodayAppointments()
      // Si mientras tanto se pidió otra, gana la última: esta respuesta es vieja.
      if (peticion !== ultimaPeticion) return
      appointments.value = lista
      loaded.value = true
      loadedAt.value = new Date()
      error.value = null
    } catch (e) {
      if (peticion !== ultimaPeticion) return
      // Si ya había datos, se conservan: el error se muestra como aviso encima.
      error.value = mensajeDeCarga(e)
    } finally {
      if (peticion === ultimaPeticion) loading.value = false
    }
  }

  /**
   * Recarga solo si pasó al menos `minIntervalMs` desde el último pedido. Para
   * disparadores automáticos (volver el foco a la pestaña), no para acciones
   * del usuario, que siempre recargan.
   */
  async function reloadIfStale(minIntervalMs: number): Promise<void> {
    if (loading.value) return
    if (Date.now() - ultimoPedidoMs < minIntervalMs) return
    await reload()
  }

  // Conteos derivados de la lista (nada escrito a mano).
  // "Agendadas" excluye las canceladas: una cancelada ya no es una cita a la
  // que haya que ir. asistio/no_asistio/ghosting cuentan como agendadas, pero
  // no como confirmadas ni pendientes.
  const scheduledCount = computed(
    () => appointments.value.filter((a) => a.status !== 'cancelada').length,
  )
  const confirmedCount = computed(
    () => appointments.value.filter((a) => a.status === 'confirmada').length,
  )
  const pendingCount = computed(
    () => appointments.value.filter((a) => a.status === 'pendiente').length,
  )
  const cancelledCount = computed(
    () => appointments.value.filter((a) => a.status === 'cancelada').length,
  )

  return {
    appointments,
    loading,
    loaded,
    error,
    loadedAt,
    reload,
    reloadIfStale,
    scheduledCount,
    confirmedCount,
    pendingCount,
    cancelledCount,
  }
})
