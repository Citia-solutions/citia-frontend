import { computed, ref } from 'vue'
import { cancelarCita } from '../api/gestionarCitaApi'
import { mensajeDeError, MOTIVO_MAX, statusDe } from './mensajeDeError'
import type { CancelarCitaRequest, ResultadoAccion } from './types'

/** Caso de uso "cancelar": motivo opcional y envío. Cancelar es terminal. */
export function useCancelarCita(appointmentId: string) {
  const motivo = ref('')
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  const errorValidacion = computed<string | null>(() =>
    motivo.value.length > MOTIVO_MAX
      ? `El motivo no puede superar ${MOTIVO_MAX} caracteres.`
      : null,
  )

  async function submit(): Promise<ResultadoAccion | null> {
    if (errorValidacion.value) return null

    submitError.value = null
    isSubmitting.value = true
    try {
      const texto = motivo.value.trim()
      const payload: CancelarCitaRequest = texto ? { motivo: texto } : {}
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

  return { motivo, errorValidacion, isSubmitting, submitError, submit }
}
