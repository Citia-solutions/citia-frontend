import { reactive, ref } from 'vue'
import { FORM_VACIO, PASOS, validarPaso, type FlujoCitaForm } from './flujoCitaModel'
import type { FlujoCitaErrors, FlujoCitaPaso } from './flujoCitaModel'

/**
 * Lógica del flujo público "Solicita una nueva cita".
 *
 * UI-only por ahora: no hay endpoint de pacientes, así que al confirmar se
 * simula un envío (isSubmitting con delay) y se pasa a `finalizado`. Cuando
 * exista el backend, `confirmar()` mapea `form` al contrato y llama la API.
 */
export function useAgendarCita() {
  const form = reactive<FlujoCitaForm>({ ...FORM_VACIO })
  const errors = ref<FlujoCitaErrors>({})
  const pasoActual = ref<FlujoCitaPaso>(PASOS[0]!.id)
  const pasoIndex = ref(0)
  const isSubmitting = ref(false)
  const finalizado = ref(false)

  function reset(): void {
    Object.assign(form, FORM_VACIO)
    errors.value = {}
    pasoIndex.value = 0
    pasoActual.value = PASOS[0]!.id
    isSubmitting.value = false
    finalizado.value = false
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

  /** Simula el envío final y pasa a la pantalla de éxito. */
  function confirmar(): void {
    const e = validarPaso(form, pasoActual.value)
    errors.value = e
    if (Object.keys(e).length > 0) return

    isSubmitting.value = true
    // TODO: reemplazar por la llamada real al endpoint de citas/pacientes.
    setTimeout(() => {
      isSubmitting.value = false
      finalizado.value = true
    }, 900)
  }

  return { form, errors, pasoActual, pasoIndex, isSubmitting, finalizado, reset, continuar, retroceder, irA, confirmar }
}
