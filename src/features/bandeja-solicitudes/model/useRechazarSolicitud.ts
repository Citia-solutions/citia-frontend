import { ref } from 'vue'
import type { Solicitud } from '@/entities/solicitud'
import { rechazarSolicitud } from '../api/bandejaApi'
import { mensajeDeError, statusDe } from './mensajeDeError'
import type { ResultadoResolucion } from './types'

/** Caso de uso "rechazar una solicitud": sin motivo (DT-26), solo confirmación. */
export function useRechazarSolicitud() {
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  function reset(): void {
    isSubmitting.value = false
    submitError.value = null
  }

  async function submit(id: string): Promise<ResultadoResolucion<Solicitud>> {
    submitError.value = null
    isSubmitting.value = true
    try {
      const valor = await rechazarSolicitud(id)
      return { ok: true, valor }
    } catch (e) {
      const mensaje = mensajeDeError(e, 'rechazar')
      submitError.value = mensaje
      return { ok: false, status: statusDe(e), mensaje }
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, submitError, reset, submit }
}
