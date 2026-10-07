import { ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import {
  getConfiguracionRecordatorios,
  type ConfiguracionRecordatoriosDto,
} from '@/entities/recordatorio'

function mensajeDeCarga(e: unknown): string {
  if (!(e instanceof HttpError)) return 'No pudimos conectar con el servidor.'
  if (e.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  return 'No pudimos cargar tu configuración de recordatorios.'
}

/**
 * Configuración de recordatorios para la tarjeta del dashboard
 * (`GET /recordatorios/configuracion`). Solo lectura: se edita en
 * `/recordatorios`. Se pide al montar la tarjeta (cada vez que se entra al
 * dashboard), así un cambio hecho en la pantalla de configuración se ve al
 * volver. Las citas no la afectan: no se recarga con ellas.
 */
export function useResumenRecordatorios() {
  const configuracion = ref<ConfiguracionRecordatoriosDto | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let ultimaPeticion = 0

  async function cargar(): Promise<void> {
    const peticion = ++ultimaPeticion
    loading.value = true
    try {
      const dto = await getConfiguracionRecordatorios()
      if (peticion !== ultimaPeticion) return
      configuracion.value = dto
      error.value = null
    } catch (e) {
      if (peticion !== ultimaPeticion) return
      error.value = mensajeDeCarga(e)
    } finally {
      if (peticion === ultimaPeticion) loading.value = false
    }
  }

  return { configuracion, loading, error, cargar }
}
