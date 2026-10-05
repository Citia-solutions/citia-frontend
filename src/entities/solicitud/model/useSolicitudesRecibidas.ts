import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { getSolicitudes, TOPE_BANDEJA } from '../api/solicitudApi'

/** Texto del fallo al contar, para quien quiera mostrarlo (la tarjeta del dashboard). */
function mensajeDeCarga(e: unknown): string {
  if (e instanceof HttpError && e.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  return 'No pudimos contar las solicitudes.'
}

/**
 * Cuántas solicitudes esperan respuesta (`recibida`): la píldora del sidebar y
 * la tarjeta "Solicitudes por responder" del dashboard.
 *
 * No hay endpoint de conteo: se cuenta la lista de `GET /solicitudes?estado=recibida`.
 * La bandeja, que ya pide esa lista, informa el número con `reportar()` para no
 * pedirla dos veces.
 *
 * Un fallo al contar no rompe nada: se conserva el último total y queda en
 * `error`. La píldora del sidebar lo ignora (simplemente no aparece si nunca
 * hubo un total); la tarjeta del dashboard lo muestra con "Reintentar".
 */
export const useSolicitudesRecibidas = defineStore('solicitudesRecibidas', () => {
  const total = ref<number | null>(null)
  /** Hay un conteo en curso. */
  const loading = ref(false)
  const error = ref<string | null>(null)

  let ultimaPeticion = 0
  let ultimoPedidoMs = 0
  /** Conteo en curso: quien pide mientras tanto espera ese mismo (no se duplica el pedido). */
  let enCurso: Promise<void> | null = null

  async function contar(): Promise<void> {
    const peticion = ++ultimaPeticion
    ultimoPedidoMs = Date.now()
    loading.value = true
    try {
      const lista = await getSolicitudes('recibida')
      if (peticion !== ultimaPeticion) return
      total.value = lista.length
      error.value = null
    } catch (e) {
      if (peticion !== ultimaPeticion) return
      error.value = mensajeDeCarga(e)
    } finally {
      if (peticion === ultimaPeticion) loading.value = false
    }
  }

  /**
   * Vuelve a contar. Si ya hay un conteo en curso, espera ese: el layout del
   * panel y el dashboard piden a la vez al entrar (los hijos se montan antes
   * que el padre) y no tiene sentido pedir dos veces la misma lista.
   */
  function refresh(): Promise<void> {
    enCurso ??= contar().finally(() => {
      enCurso = null
    })
    return enCurso
  }

  /** Recarga solo si pasó `minIntervalMs` desde el último pedido (volver el foco). */
  async function refreshIfStale(minIntervalMs: number): Promise<void> {
    if (Date.now() - ultimoPedidoMs < minIntervalMs) return
    await refresh()
  }

  /** La bandeja cargó la lista de recibidas: se usa su largo. */
  function reportar(n: number): void {
    ultimaPeticion += 1 // una cuenta en vuelo ya es más vieja que esta
    ultimoPedidoMs = Date.now()
    total.value = n
    error.value = null
    loading.value = false
  }

  /** Texto de la píldora: null si no hay nada que mostrar. '100+' si se llegó al tope. */
  const etiqueta = computed<string | null>(() => {
    if (!total.value) return null
    return total.value >= TOPE_BANDEJA ? `${TOPE_BANDEJA}+` : String(total.value)
  })

  return { total, loading, error, etiqueta, refresh, refreshIfStale, reportar }
})
