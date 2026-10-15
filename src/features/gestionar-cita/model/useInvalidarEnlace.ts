import { ref } from 'vue'
import { invalidarEnlacePaciente } from '../api/gestionarCitaApi'
import { statusDe } from './mensajeDeError'
import type { ResultadoInvalidarEnlace } from './types'

/** Mensaje accionable para un fallo de `POST /citas/:id/enlace/invalidar`. */
function mensajeDeError(e: unknown): string {
  switch (statusDe(e)) {
    case null:
      return 'No pudimos conectar con el servidor. Revisa tu conexión.'
    case 401:
      return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    case 404:
      // No se distingue "no existe" de "es de otra organización", igual que el backend.
      return 'Esta cita ya no está disponible.'
    default:
      return 'No se pudo invalidar el enlace. Inténtalo de nuevo.'
  }
}

/**
 * Caso de uso "invalidar el enlace del paciente" (Fase 3, decisión S1): el
 * enlace de los recordatorios deja de servir. Sin formulario: la vista explica
 * qué pasa y pide confirmación.
 *
 * La ruta es idempotente (204 aunque no haya enlace activo), así que no hay
 * 409: el único fallo que cambia el voucher es el 404 (la cita ya no está).
 */
export function useInvalidarEnlace(appointmentId: string) {
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  async function submit(): Promise<ResultadoInvalidarEnlace> {
    submitError.value = null
    isSubmitting.value = true
    try {
      await invalidarEnlacePaciente(appointmentId)
      return { ok: true }
    } catch (e) {
      const mensaje = mensajeDeError(e)
      submitError.value = mensaje
      return { ok: false, status: statusDe(e), mensaje }
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, submitError, submit }
}
