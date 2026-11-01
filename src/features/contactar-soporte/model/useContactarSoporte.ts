import { computed, reactive, ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { mensajeDelBackend, mensajesDeValidacion } from '@/shared/api/erroresValidacion'
import { enviarMensajeSoporte } from '../api/soporteApi'
import { erroresDelServidor, validarMensaje } from './soporteSchema'
import type {
  MensajeSoporteCreado,
  MensajeSoporteErrors,
  MensajeSoporteField,
  MensajeSoporteForm,
} from './types'

function mensajeDeError(e: unknown): string {
  if (!(e instanceof HttpError)) return 'No pudimos conectar con el servidor. Revisa tu conexión.'
  switch (e.status) {
    case 400:
      return mensajeDelBackend(e) ?? 'Revisa tu mensaje: el servidor lo rechazó.'
    case 401:
      return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    case 429:
      // El tope de la organización (5 en 24 horas) o el límite por IP: cada
      // uno con su texto, que dice qué hacer.
      return mensajeDelBackend(e) ?? 'Demasiados intentos, prueba en unos minutos.'
    default:
      return 'No se pudo enviar tu mensaje. Inténtalo de nuevo.'
  }
}

/**
 * Caso de uso "contactar soporte" (US-10): categoría obligatoria (ninguna
 * marcada al abrir, F3) y el texto, de hasta 2000 caracteres.
 *
 * El modal llama a `reset()` cada vez que se abre: un mensaje enviado o a
 * medio escribir no reaparece la vez siguiente.
 */
export function useContactarSoporte() {
  const form = reactive<MensajeSoporteForm>({ categoria: null, mensaje: '' })
  /** Ya se intentó enviar: desde ahí se muestran todos los avisos. */
  const intentado = ref(false)
  const mensajeTocado = ref(false)
  const erroresServidor = ref<MensajeSoporteErrors>({})

  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)
  /** La respuesta del 201: el modal pasa a la vista "Recibimos tu mensaje." */
  const enviado = ref<MensajeSoporteCreado | null>(null)

  const errores = computed<MensajeSoporteErrors>(() => {
    const locales = validarMensaje(form)
    const visibles: MensajeSoporteErrors = { ...erroresServidor.value }
    if (intentado.value && locales.categoria) visibles.categoria = locales.categoria
    if ((intentado.value || mensajeTocado.value) && locales.mensaje) {
      visibles.mensaje = locales.mensaje
    }
    return visibles
  })

  function reset(): void {
    form.categoria = null
    form.mensaje = ''
    intentado.value = false
    mensajeTocado.value = false
    erroresServidor.value = {}
    submitError.value = null
    enviado.value = null
  }

  function marcarMensajeTocado(): void {
    mensajeTocado.value = true
  }

  /** Al cambiar un campo, el error que mandó el servidor para ese campo deja de valer. */
  function alEditar(campo: MensajeSoporteField): void {
    if (erroresServidor.value[campo]) {
      const resto = { ...erroresServidor.value }
      delete resto[campo]
      erroresServidor.value = resto
    }
  }

  /** Envía el mensaje. `true` si el servidor lo guardó. */
  async function enviar(): Promise<boolean> {
    submitError.value = null
    intentado.value = true
    if (Object.keys(validarMensaje(form)).length > 0 || form.categoria === null) return false

    isSubmitting.value = true
    try {
      enviado.value = await enviarMensajeSoporte({
        categoria: form.categoria,
        mensaje: form.mensaje.trim(),
      })
      return true
    } catch (e) {
      const porCampo =
        e instanceof HttpError && e.status === 400
          ? erroresDelServidor(mensajesDeValidacion(e), mensajeDelBackend(e))
          : {}
      erroresServidor.value = porCampo
      submitError.value = Object.keys(porCampo).length > 0 ? null : mensajeDeError(e)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    errores,
    isSubmitting,
    submitError,
    enviado,
    reset,
    marcarMensajeTocado,
    alEditar,
    enviar,
  }
}
