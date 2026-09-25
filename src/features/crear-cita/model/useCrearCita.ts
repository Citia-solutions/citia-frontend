import { reactive, ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { crearCita } from '../api/crearCitaApi'
import { validateNuevaCita } from './crearCitaSchema'
import { toCrearCitaRequest } from './toCrearCitaRequest'
import type { CitaCreada, NuevaCitaErrors, NuevaCitaForm } from './types'

const FORM_VACIO: NuevaCitaForm = {
  rut: '',
  pacienteNombre: '',
  correo: '',
  telefono: '',
  fecha: '',
  hora: '',
  duracionMin: 30,
  motivo: '',
  consentimiento: false,
}

/** Traduce el fallo del servidor a algo que el profesional pueda accionar. */
function mensajeDeError(e: unknown): string {
  if (!(e instanceof HttpError)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.'
  }

  switch (e.status) {
    case 400:
      // Datos rechazados: RUT con dígito verificador malo, campos faltantes,
      // o un paciente que no pertenece a esta organización.
      return 'Revisa los datos ingresados: el servidor los rechazó.'
    case 401:
      return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    case 409:
      // El backend responde 409 ante una transición de estado ilegal.
      return 'La cita ya no está en un estado que permita esta acción.'
    default:
      return 'No se pudo guardar la cita. Inténtalo de nuevo.'
  }
}

/**
 * Lógica del caso de uso "crear cita": estado del formulario, validación,
 * llamada a POST /citas y manejo de errores.
 *
 * onSuccess solo se llama cuando el servidor respondió OK, por lo que el modal
 * puede cerrarse con seguridad recién ahí. Recibe la cita tal como quedó
 * guardada —con su id y el paciente resuelto—, no lo que se tecleó.
 *
 * @param onSuccess callback tras guardar la cita en el servidor.
 */
export function useCrearCita(onSuccess: (cita: CitaCreada) => void) {
  const form = reactive<NuevaCitaForm>({ ...FORM_VACIO })

  const errors = ref<NuevaCitaErrors>({})
  const submitError = ref<string | null>(null)
  const isSubmitting = ref(false)

  /** Limpia el formulario (se llama al abrir el modal). */
  function reset(): void {
    Object.assign(form, FORM_VACIO)
    errors.value = {}
    submitError.value = null
  }

  async function submit(): Promise<void> {
    submitError.value = null
    errors.value = validateNuevaCita(form)
    if (Object.keys(errors.value).length > 0) return

    isSubmitting.value = true
    try {
      const cita = await crearCita(toCrearCitaRequest(form))
      onSuccess(cita)
    } catch (e) {
      submitError.value = mensajeDeError(e)
    } finally {
      isSubmitting.value = false
    }
  }

  return { form, errors, submitError, isSubmitting, reset, submit }
}
