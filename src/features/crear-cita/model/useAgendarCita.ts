import { reactive, ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { enviarSolicitud } from '../api/agendarCitaApi'
import { FORM_VACIO, PASOS, validarPaso, type FlujoCitaForm } from './flujoCitaModel'
import type { FlujoCitaErrors, FlujoCitaPaso } from './flujoCitaModel'
import { toSolicitudRequest } from './toSolicitudRequest'

/** Traduce el fallo del servidor a algo que el paciente pueda accionar. */
function mensajeDeError(e: unknown): string {
  if (!(e instanceof HttpError)) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
  }
  // 400 = datos rechazados (p. ej. el RUT no pasa el dígito verificador).
  if (e.status === 400) {
    return 'Revisa los datos ingresados: el servidor los rechazó.'
  }
  return 'No pudimos enviar tu solicitud. Inténtalo de nuevo en un momento.'
}

/**
 * Lógica del flujo público "Solicita una nueva cita".
 *
 * Al confirmar envía la solicitud a la organización del enlace. El paciente
 * **pide** una hora: elige el día y la hora que le acomodan, y eso viaja como
 * preferencia. La hora real la fija el profesional al aceptar, así que un envío
 * correcto significa "solicitud recibida", no "cita agendada".
 *
 * @param tenantSlug organización del enlace público (viene de la URL).
 */
export function useAgendarCita(tenantSlug: () => string) {
  const form = reactive<FlujoCitaForm>({ ...FORM_VACIO })
  const errors = ref<FlujoCitaErrors>({})
  const pasoActual = ref<FlujoCitaPaso>(PASOS[0]!.id)
  const pasoIndex = ref(0)
  const isSubmitting = ref(false)
  const finalizado = ref(false)
  const submitError = ref<string | null>(null)

  function reset(): void {
    Object.assign(form, FORM_VACIO)
    errors.value = {}
    pasoIndex.value = 0
    pasoActual.value = PASOS[0]!.id
    isSubmitting.value = false
    finalizado.value = false
    submitError.value = null
  }

  /** Valida la sección actual; si está OK, avanza a la siguiente. */
  function continuar(): boolean {
    const e = validarPaso(form, pasoActual.value)
    errors.value = e
    if (Object.keys(e).length > 0) return false

    if (pasoIndex.value < PASOS.length - 1) {
      pasoIndex.value += 1
      pasoActual.value = PASOS[pasoIndex.value]!.id
      errors.value = {}
    }
    return true
  }

  function retroceder(): void {
    if (pasoIndex.value > 0) {
      pasoIndex.value -= 1
      pasoActual.value = PASOS[pasoIndex.value]!.id
      errors.value = {}
    }
  }

  /**
   * Salta a la sección indicada (usado por los íconos del stepper).
   *
   * Hacia atrás (o a la misma) navega libre. Hacia adelante solo si la sección
   * actual está válida: si no, se queda y muestra sus errores, como al pulsar
   * Continuar.
   */
  function irA(paso: FlujoCitaPaso): void {
    const destino = PASOS.findIndex((p) => p.id === paso)
    if (destino < 0 || destino === pasoIndex.value) return

    if (destino > pasoIndex.value) {
      const e = validarPaso(form, pasoActual.value)
      errors.value = e
      if (Object.keys(e).length > 0) return
    }

    pasoIndex.value = destino
    pasoActual.value = paso
    errors.value = {}
  }

  /** Envía la solicitud y, si el servidor la acepta, pasa a la pantalla final. */
  async function confirmar(): Promise<void> {
    submitError.value = null
    const e = validarPaso(form, pasoActual.value)
    errors.value = e
    if (Object.keys(e).length > 0) return

    isSubmitting.value = true
    try {
      await enviarSolicitud(tenantSlug(), toSolicitudRequest(form))
      finalizado.value = true
    } catch (err) {
      submitError.value = mensajeDeError(err)
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    errors,
    pasoActual,
    pasoIndex,
    isSubmitting,
    finalizado,
    submitError,
    reset,
    continuar,
    retroceder,
    irA,
    confirmar,
  }
}
