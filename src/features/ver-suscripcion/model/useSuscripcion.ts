import { ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { getSuscripcion } from '../api/suscripcionApi'
import type { Suscripcion } from './types'

/**
 * Texto del 403 (`SoloAdministradorError`). No debería verse: la pestaña
 * Suscripción solo existe para el administrador; el permiso lo decide el
 * backend.
 */
export const SOLO_ADMINISTRADOR = 'Solo el administrador de la organización ve la suscripción.'

/**
 * Caso de uso "ver suscripción" (US-10): lectura de la suscripción de la
 * organización. Un 403 no se reintenta (`reintentable: false`).
 */
export function useSuscripcion() {
  const suscripcion = ref<Suscripcion | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const reintentable = ref(true)

  async function cargar(): Promise<void> {
    loading.value = true
    error.value = null
    reintentable.value = true
    try {
      suscripcion.value = await getSuscripcion()
    } catch (e) {
      if (!(e instanceof HttpError)) {
        error.value = 'No pudimos conectar con el servidor. Revisa tu conexión.'
      } else if (e.status === 403) {
        error.value = SOLO_ADMINISTRADOR
        reintentable.value = false
      } else if (e.status === 401) {
        error.value = 'Tu sesión expiró. Vuelve a iniciar sesión.'
      } else {
        error.value = 'No pudimos cargar la suscripción.'
      }
    } finally {
      loading.value = false
    }
  }

  return { suscripcion, loading, error, reintentable, cargar }
}
