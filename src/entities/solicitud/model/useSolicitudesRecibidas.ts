import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getSolicitudes, TOPE_BANDEJA } from '../api/solicitudApi'

/**
 * Cuántas solicitudes esperan respuesta (`recibida`): la píldora del sidebar.
 *
 * No hay endpoint de conteo: se cuenta la lista de `GET /solicitudes?estado=recibida`.
 * La bandeja, que ya pide esa lista, informa el número con `reportar()` para no
 * pedirla dos veces. Un fallo al contar no se muestra: la píldora simplemente
 * no aparece (el error real lo ve la bandeja).
 */
export const useSolicitudesRecibidas = defineStore('solicitudesRecibidas', () => {
  const total = ref<number | null>(null)

  let ultimaPeticion = 0
  let ultimoPedidoMs = 0

  async function refresh(): Promise<void> {
    const peticion = ++ultimaPeticion
    ultimoPedidoMs = Date.now()
    try {
      const lista = await getSolicitudes('recibida')
      if (peticion === ultimaPeticion) total.value = lista.length
    } catch {
      // Silencioso a propósito (ver arriba).
    }
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
  }

  /** Texto de la píldora: null si no hay nada que mostrar. '100+' si se llegó al tope. */
  const etiqueta = computed<string | null>(() => {
    if (!total.value) return null
    return total.value >= TOPE_BANDEJA ? `${TOPE_BANDEJA}+` : String(total.value)
  })

  return { total, etiqueta, refresh, refreshIfStale, reportar }
})
