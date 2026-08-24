import { reactive, ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { crearCita } from '../api/crearCitaApi'
import { validateNuevaCita } from './crearCitaSchema'
import type { NuevaCitaErrors, NuevaCitaForm } from './types'

/**
 * Lógica del caso de uso "crear cita": estado del formulario, validación,
 * llamada a POST /api/citas y manejo de errores.
 *
 * onSuccess solo se llama cuando el servidor respondió OK, por lo que el modal
 * puede cerrarse con seguridad recién ahí.
 *
 * @param onSuccess callback tras guardar la cita en el servidor.
 */
export function useCrearCita(onSuccess: (payload: NuevaCitaForm) => void) {
  const form = reactive<NuevaCitaForm>({
    pacienteNombre: '',
    correo: '',
    telefono: '',
    fecha: '',
    hora: '',
    motivo: '',
  })

  const errors = ref<NuevaCitaErrors>({})
  const submitError = ref<string | null>(null)
  const isSubmitting = ref(false)

  /** Limpia el formulario (se llama al abrir el modal). */
  function reset(): void {
    form.pacienteNombre = ''
    form.correo = ''
    form.telefono = ''
    form.fecha = ''
    form.hora = ''
    form.motivo = ''
    errors.value = {}
    submitError.value = null
  }

  async function submit(): Promise<void> {
    submitError.value = null
    errors.value = validateNuevaCita(form)
    if (Object.keys(errors.value).length > 0) return

    isSubmitting.value = true
    try {
      await crearCita({ ...form })
      onSuccess({ ...form })
    } catch (e) {
      submitError.value =
        e instanceof HttpError && e.status === 400
          ? 'Revisa los datos ingresados.'
          : 'No se pudo guardar la cita. Inténtalo de nuevo.'
    } finally {
      isSubmitting.value = false
    }
  }

  return { form, errors, submitError, isSubmitting, reset, submit }
}
