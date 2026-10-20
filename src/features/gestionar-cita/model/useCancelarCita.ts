import { computed, ref } from 'vue'
import { cancelarCita } from '../api/gestionarCitaApi'
import { mensajeDeError, MOTIVO_MAX, PEDIDO_POR_REQUERIDO, statusDe } from './mensajeDeError'
import type { CancelarCitaRequest, PedidoPor, ResultadoAccion } from './types'

/**
 * Caso de uso "cancelar": quién lo pidió (obligatorio, US-07.01), motivo
 * opcional y envío. Cancelar es terminal.
 *
 * "¿Quién lo pidió?" empieza sin respuesta (`null`) y sin ella no se envía: la
 * API lo acepta ausente (cuenta como del profesional), pero la pantalla lo exige
 * para que el dato no llegue vacío por descuido.
 */
export function useCancelarCita(appointmentId: string) {
  const motivo = ref('')
  const pedidoPor = ref<PedidoPor | null>(null)
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  const errorValidacion = computed<string | null>(() =>
    motivo.value.length > MOTIVO_MAX
      ? `El motivo no puede superar ${MOTIVO_MAX} caracteres.`
      : null,
  )

  /** Aviso mientras "¿Quién lo pidió?" no tiene respuesta, o null. */
  const errorPedidoPor = computed<string | null>(() =>
    pedidoPor.value === null ? PEDIDO_POR_REQUERIDO : null,
  )

  async function submit(): Promise<ResultadoAccion | null> {
    const quien = pedidoPor.value
    if (errorValidacion.value || quien === null) return null

    submitError.value = null
    isSubmitting.value = true
    try {
      const texto = motivo.value.trim()
      const payload: CancelarCitaRequest = {
        pedidoPor: quien,
        ...(texto ? { motivo: texto } : {}),
      }
      const cita = await cancelarCita(appointmentId, payload)
      return { ok: true, cita }
    } catch (e) {
      const mensaje = mensajeDeError(e)
      submitError.value = mensaje
      return { ok: false, status: statusDe(e), mensaje }
    } finally {
      isSubmitting.value = false
    }
  }

  return { motivo, pedidoPor, errorValidacion, errorPedidoPor, isSubmitting, submitError, submit }
}
