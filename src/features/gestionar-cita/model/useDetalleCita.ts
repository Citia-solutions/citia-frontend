import { ref } from 'vue'
import { getAppointment, type AppointmentDetail } from '@/entities/appointment'
import { statusDe } from './mensajeDeError'

/**
 * Detalle de la cita abierta en el voucher (`GET /citas/:id`): datos de
 * contacto, estado fresco y `accionesPermitidas`, que es lo que gobierna los
 * botones. Se pide al abrir y de nuevo tras cada acción.
 */
export function useDetalleCita() {
  const detail = ref<AppointmentDetail | null>(null)
  const loading = ref(false)
  /** La cita no existe o es de otra organización (404). */
  const notFound = ref(false)
  /** Falló por otra razón (red, 5xx, 401…): el resto del voucher sigue en pie. */
  const failed = ref(false)

  /** Descarta respuestas de una cita anterior o de un pedido superado. */
  let ultimaPeticion = 0

  function reset(): void {
    ultimaPeticion += 1
    detail.value = null
    loading.value = false
    notFound.value = false
    failed.value = false
  }

  /** Pide el detalle. Devuelve el detalle nuevo, o null si falló o quedó obsoleto. */
  async function load(id: string): Promise<AppointmentDetail | null> {
    const peticion = ++ultimaPeticion
    loading.value = true
    failed.value = false
    try {
      const nuevo = await getAppointment(id)
      if (peticion !== ultimaPeticion) return null
      detail.value = nuevo
      notFound.value = false
      return nuevo
    } catch (e) {
      if (peticion !== ultimaPeticion) return null
      if (statusDe(e) === 404) notFound.value = true
      else failed.value = true
      return null
    } finally {
      if (peticion === ultimaPeticion) loading.value = false
    }
  }

  return { detail, loading, notFound, failed, reset, load }
}
