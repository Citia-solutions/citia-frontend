import { computed, reactive, ref } from 'vue'
import { mensajesDeValidacion } from '@/shared/api/erroresValidacion'
import type { AppointmentPatient } from '@/entities/appointment'
import { actualizarContactoPaciente } from '../api/gestionarCitaApi'
import { statusDe } from './mensajeDeError'
import type { ActualizarContactoRequest, ResultadoContacto } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9 ()-]+$/

/**
 * Largo máximo del correo: espejo de `@MaxLength(254)` de
 * `ActualizarPacienteDto` (mismo que al crear). Patrón DTF-06.
 */
export const CORREO_MAX = 254

export interface ContactoForm {
  telefono: string
  correo: string
}

type CampoContacto = keyof ContactoForm
type ErroresContacto = Partial<Record<CampoContacto, string>>

/** Mensaje accionable para un fallo de `PATCH /pacientes/:id` que no nombra un campo. */
function mensajeDeError(e: unknown): string {
  switch (statusDe(e)) {
    case null:
      return 'No pudimos conectar con el servidor. Revisa tu conexión.'
    case 400:
      return 'Revisa los datos de contacto: el servidor los rechazó.'
    case 401:
      return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    case 404:
      // No se distingue "no existe" de "es de otra organización", igual que el backend.
      return 'Este paciente ya no está disponible.'
    default:
      return 'No se pudo guardar el contacto. Inténtalo de nuevo.'
  }
}

/** Errores por campo a partir de los mensajes de un 400 (`"correo must be an email"`). */
function erroresDelServidor(mensajes: string[]): ErroresContacto {
  const errores: ErroresContacto = {}
  for (const mensaje of mensajes) {
    if (mensaje.startsWith('correo ')) errores.correo ??= 'El servidor rechazó el correo. Revisa que esté bien escrito.'
    else if (mensaje.startsWith('telefono ')) errores.telefono ??= 'El servidor rechazó el teléfono.'
  }
  return errores
}

/**
 * Caso de uso "editar contacto" del paciente desde el voucher
 * (`PATCH /pacientes/:id`). Sirve sobre todo para completar el correo de
 * pacientes antiguos que no lo tienen: sin él, sus recordatorios terminan
 * `omitido` (`sin_correo`).
 *
 * Solo viaja lo que cambió. El correo no se puede vaciar (el PATCH no borra
 * datos); el teléfono tampoco.
 */
export function useEditarContacto(paciente: AppointmentPatient) {
  const original: ContactoForm = {
    telefono: paciente.phone,
    correo: paciente.email ?? '',
  }

  const form = reactive<ContactoForm>({ ...original })
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)
  const erroresServidor = ref<ErroresContacto>({})

  const telefonoCambio = computed(() => form.telefono.trim() !== original.telefono.trim())
  // El backend guarda el correo en minúsculas: cambiar solo mayúsculas no es un cambio.
  const correoCambio = computed(
    () => form.correo.trim().toLowerCase() !== original.correo.trim().toLowerCase(),
  )
  const hayCambios = computed(() => telefonoCambio.value || correoCambio.value)

  /**
   * Errores en vivo, solo de los campos que se tocaron: lo que viene del
   * servidor ya es válido por definición.
   */
  const errores = computed<ErroresContacto>(() => {
    const e: ErroresContacto = { ...erroresServidor.value }
    const telefono = form.telefono.trim()
    if (telefonoCambio.value) {
      if (!telefono) e.telefono = 'Ingresa el teléfono.'
      else if (!PHONE_RE.test(telefono)) e.telefono = 'El teléfono no es válido.'
    }
    const correo = form.correo.trim()
    if (correoCambio.value) {
      if (!correo) e.correo = 'El correo no se puede dejar vacío.'
      else if (correo.length > CORREO_MAX) e.correo = `El correo no puede superar los ${CORREO_MAX} caracteres.`
      else if (!EMAIL_RE.test(correo)) e.correo = 'El correo no es válido. Revisa que esté bien escrito.'
    }
    return e
  })

  const puedeGuardar = computed(() => hayCambios.value && Object.keys(errores.value).length === 0)

  /** Al escribir, el error que había mandado el servidor para ese campo deja de valer. */
  function limpiarErrorServidor(campo: CampoContacto): void {
    if (erroresServidor.value[campo]) {
      const resto = { ...erroresServidor.value }
      delete resto[campo]
      erroresServidor.value = resto
    }
  }

  async function submit(): Promise<ResultadoContacto | null> {
    if (!puedeGuardar.value) return null

    const payload: ActualizarContactoRequest = {
      ...(telefonoCambio.value ? { telefono: form.telefono.trim() } : {}),
      ...(correoCambio.value ? { correo: form.correo.trim() } : {}),
    }

    submitError.value = null
    isSubmitting.value = true
    try {
      const actualizado = await actualizarContactoPaciente(paciente.id, payload)
      return { ok: true, paciente: actualizado, correoCambio: 'correo' in payload }
    } catch (e) {
      const porCampo = erroresDelServidor(mensajesDeValidacion(e))
      erroresServidor.value = porCampo
      const mensaje =
        Object.keys(porCampo).length > 0
          ? 'Revisa los campos marcados: el servidor los rechazó.'
          : mensajeDeError(e)
      submitError.value = mensaje
      return { ok: false, status: statusDe(e), mensaje }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    errores,
    hayCambios,
    puedeGuardar,
    isSubmitting,
    submitError,
    limpiarErrorServidor,
    submit,
  }
}
