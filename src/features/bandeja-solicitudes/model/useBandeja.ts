import { ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import {
  getSolicitudes,
  useSolicitudesRecibidas,
  type EstadoSolicitud,
  type Solicitud,
} from '@/entities/solicitud'

function mensajeDeCarga(e: unknown): string {
  if (e instanceof HttpError && e.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  }
  return 'No pudimos cargar las solicitudes.'
}

/**
 * Lista de la bandeja para la pestaña activa (`GET /solicitudes?estado=`).
 *
 * Igual que las listas de citas: refrescar = volver a pedir, nunca quitar a
 * mano la fila aceptada o rechazada. Así el orden y lo que falta lo decide el
 * backend (y un 409 por "otra persona la resolvió" se arregla solo).
 *
 * Cuando carga la pestaña `recibida`, informa el total a la píldora del sidebar.
 */
export function useBandeja() {
  const recibidas = useSolicitudesRecibidas()

  const estado = ref<EstadoSolicitud>('recibida')
  const solicitudes = ref<Solicitud[]>([])
  const loading = ref(false)
  /** La pestaña activa ya cargó al menos una vez. */
  const loaded = ref(false)
  const error = ref<string | null>(null)

  let ultimaPeticion = 0
  let ultimoPedidoMs = 0

  async function reload(): Promise<void> {
    const peticion = ++ultimaPeticion
    const pedido = estado.value
    ultimoPedidoMs = Date.now()
    loading.value = true
    try {
      const lista = await getSolicitudes(pedido)
      if (peticion !== ultimaPeticion) return
      solicitudes.value = lista
      loaded.value = true
      error.value = null
      if (pedido === 'recibida') recibidas.reportar(lista.length)
    } catch (e) {
      if (peticion !== ultimaPeticion) return
      error.value = mensajeDeCarga(e)
    } finally {
      if (peticion === ultimaPeticion) loading.value = false
    }
  }

  /** Cambia de pestaña: la lista anterior no se mezcla con la nueva. */
  async function cambiarEstado(nuevo: EstadoSolicitud): Promise<void> {
    if (nuevo === estado.value && loaded.value) return
    estado.value = nuevo
    solicitudes.value = []
    loaded.value = false
    error.value = null
    await reload()
  }

  async function reloadIfStale(minIntervalMs: number): Promise<void> {
    if (loading.value) return
    if (Date.now() - ultimoPedidoMs < minIntervalMs) return
    await reload()
  }

  return { estado, solicitudes, loading, loaded, error, reload, cambiarEstado, reloadIfStale }
}
