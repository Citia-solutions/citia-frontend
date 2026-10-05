import { ref } from 'vue'
import { cambiarEstadoCita } from '../api/gestionarCitaApi'
import { mensajeDeError, statusDe } from './mensajeDeError'
import type { ResultadoAccion, TransicionEstado } from './types'

/**
 * Caso de uso "confirmar / registrar asistencia / registrar inasistencia".
 * Sin formulario: la vista solo pide confirmación y envía.
 *
 * El front no decide si la transición es legal: el botón aparece solo si
 * viene en `accionesPermitidas` y, si la cita cambió entretanto, el backend
 * responde 409 (que el voucher atiende recargando el detalle). Lo único que
 * agrega el front es CUÁNDO: Asistió / No asistió se ofrecen desde la hora de
 * inicio (`useYaEmpezo`, 2026-10-05); el backend no lo exige.
 */
export function useCambiarEstadoCita(appointmentId: string, transicion: TransicionEstado) {
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  async function submit(): Promise<ResultadoAccion> {
    submitError.value = null
    isSubmitting.value = true
    try {
      const cita = await cambiarEstadoCita(appointmentId, transicion)
      return { ok: true, cita }
    } catch (e) {
      const status = statusDe(e)
      // Estas rutas no tienen cuerpo: un 400 solo puede ser un id mal formado.
      const mensaje = status === 400 ? 'No se pudo completar la acción. Inténtalo de nuevo.' : mensajeDeError(e)
      submitError.value = mensaje
      return { ok: false, status, mensaje }
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, submitError, submit }
}
