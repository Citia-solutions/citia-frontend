import { defineStore } from 'pinia'
import { ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { fechaEnClinicaISO } from '@/shared/lib/fecha'
import { getAppointmentsInRange, type AgendaAppointment } from '@/entities/appointment'
import { rangoProximosDias, rangoUltimasSemanas, type RangoDias } from './resumen'

/**
 * Store de citas de un rango que se calcula a partir de "hoy" en cada recarga
 * (`GET /citas?desde&hasta`). Mismas reglas que `useTodayAppointments`
 * (US-02.09): la página compone y llama a `reload()` cuando las citas cambian;
 * refrescar = volver a pedir; gana el último pedido; si una recarga falla con
 * datos ya cargados, se conservan.
 *
 * Es un store (y no un composable de cada widget) para que la página pueda
 * pedir la recarga tras crear, reagendar, cancelar o confirmar, igual que con
 * "Citas de hoy". Recalcular el rango en cada recarga cubre cruzar la
 * medianoche con la pestaña abierta.
 */
function definirStoreDeRango(id: string, calcularRango: (hoy: string) => RangoDias, errorDeCarga: string) {
  return defineStore(id, () => {
    const appointments = ref<AgendaAppointment[]>([])
    /** Rango de la última carga exitosa (al que corresponden `appointments`). */
    const desde = ref('')
    const hasta = ref('')
    const loading = ref(false)
    const loaded = ref(false)
    const error = ref<string | null>(null)

    let ultimaPeticion = 0
    let ultimoPedidoMs = 0

    async function reload(): Promise<void> {
      const peticion = ++ultimaPeticion
      ultimoPedidoMs = Date.now()
      // "Hoy" en la zona de la clínica: solo decide qué días se piden.
      const rango = calcularRango(fechaEnClinicaISO(new Date()))
      loading.value = true
      try {
        const lista = await getAppointmentsInRange(rango.desde, rango.hasta)
        if (peticion !== ultimaPeticion) return
        appointments.value = lista
        desde.value = rango.desde
        hasta.value = rango.hasta
        loaded.value = true
        error.value = null
      } catch (e) {
        if (peticion !== ultimaPeticion) return
        error.value =
          e instanceof HttpError && e.status === 401
            ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
            : errorDeCarga
      } finally {
        if (peticion === ultimaPeticion) loading.value = false
      }
    }

    /** Recarga solo si pasó `minIntervalMs` desde el último pedido (volver el foco). */
    async function reloadIfStale(minIntervalMs: number): Promise<void> {
      if (loading.value) return
      if (Date.now() - ultimoPedidoMs < minIntervalMs) return
      await reload()
    }

    return { appointments, desde, hasta, loading, loaded, error, reload, reloadIfStale }
  })
}

/** Citas de hoy y los 6 días siguientes: tarjeta "Próximos 7 días". */
export const useProximasCitas = definirStoreDeRango(
  'dashboardProximasCitas',
  (hoy) => rangoProximosDias(hoy),
  'No pudimos cargar las citas de los próximos días.',
)

/** Citas de las últimas 6 semanas lunes–domingo (42 días, un pedido): "Citas por semana". */
export const useHistorialCitas = definirStoreDeRango(
  'dashboardHistorialCitas',
  (hoy) => rangoUltimasSemanas(hoy),
  'No pudimos cargar las citas de las últimas semanas.',
)
