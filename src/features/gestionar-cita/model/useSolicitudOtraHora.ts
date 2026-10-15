import { ref } from 'vue'
import { getSolicitudOtraHoraAbierta, type Solicitud } from '@/entities/solicitud'

/**
 * La solicitud de otra hora que el paciente dejó abierta desde el enlace de su
 * recordatorio (Fase 3, decisión R4): el voucher muestra "El paciente pidió
 * otra hora: …" con un enlace a la bandeja, que es donde se resuelve.
 *
 * `GET /solicitudes?citaOrigenId=<id>&estado=recibida`. Es información de
 * apoyo: si falla, la nota simplemente no aparece (no se muestra error). Mismo
 * cuidado que `useDetalleCita` con las respuestas de una cita anterior.
 */
export function useSolicitudOtraHora() {
  const solicitud = ref<Solicitud | null>(null)

  let ultimaPeticion = 0

  function reset(): void {
    ultimaPeticion += 1
    solicitud.value = null
  }

  async function cargar(citaId: string): Promise<void> {
    const peticion = ++ultimaPeticion
    try {
      const abierta = await getSolicitudOtraHoraAbierta(citaId)
      if (peticion !== ultimaPeticion) return
      solicitud.value = abierta
    } catch {
      // Se conserva lo último que se supo: un fallo de red no borra la nota.
    }
  }

  return { solicitud, reset, cargar }
}
