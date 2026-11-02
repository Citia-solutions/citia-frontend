import { computed, reactive, ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { mensajeDelBackend, mensajesDeValidacion } from '@/shared/api/erroresValidacion'
import { useSessionStore } from '@/entities/session'
import { cambiarContrasena } from '../api/contrasenaApi'
import { erroresDelServidor, validarContrasena } from './contrasenaSchema'
import type { ContrasenaErrors, ContrasenaField, ContrasenaForm } from './types'

export const CONTRASENA_CAMBIADA = 'Listo. Cerramos las demás sesiones abiertas.'
export const CAMBIO_EN_PARALELO = 'Tu contraseña cambió mientras tanto; vuelve a intentarlo.'
const DEMASIADOS_INTENTOS = 'Demasiados intentos, prueba en unos minutos.'

const CAMPOS: readonly ContrasenaField[] = ['actual', 'nueva', 'confirmacion']

function mensajeDeError(e: unknown): string {
  if (!(e instanceof HttpError)) return 'No pudimos conectar con el servidor. Revisa tu conexión.'
  switch (e.status) {
    case 400:
      // Un texto de dominio que no nombra un campo conocido va tal cual.
      return mensajeDelBackend(e) ?? 'Revisa los datos: el servidor los rechazó.'
    case 401:
      return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    case 409:
      return CAMBIO_EN_PARALELO
    case 429:
      // El del límite de tasa del backend, o el de siempre si no trae texto.
      return mensajeDelBackend(e) ?? DEMASIADOS_INTENTOS
    default:
      return 'No se pudo cambiar la contraseña. Inténtalo de nuevo.'
  }
}

/**
 * Caso de uso "cambiar contraseña" (US-10): contraseña actual, nueva y su
 * confirmación (la igualdad solo se comprueba aquí).
 *
 * - **200:** el backend corta todas las sesiones y devuelve el token nuevo de
 *   esta; se reemplaza el guardado (`session.replaceToken`), se avisa y se
 *   limpia el formulario. La sesión actual sigue.
 * - **400:** el mensaje del backend junto a su campo, y **la sesión sigue**
 *   (nunca es un 401).
 * - **409 / 429:** mensaje general.
 */
export function useCambiarContrasena() {
  const session = useSessionStore()

  const form = reactive<ContrasenaForm>({ actual: '', nueva: '', confirmacion: '' })
  const tocados = reactive<Record<ContrasenaField, boolean>>({
    actual: false,
    nueva: false,
    confirmacion: false,
  })
  const erroresServidor = ref<ContrasenaErrors>({})

  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)
  const ok = ref<string | null>(null)

  /** Correo de la sesión: el campo oculto `username` para el gestor de contraseñas. */
  const usuario = computed(() => session.currentUser?.email ?? '')

  const errores = computed<ContrasenaErrors>(() => {
    const locales = validarContrasena(form)
    const visibles: ContrasenaErrors = { ...erroresServidor.value }
    for (const campo of CAMPOS) {
      if (tocados[campo] && locales[campo]) visibles[campo] = locales[campo]
    }
    return visibles
  })

  function marcarTocado(campo: ContrasenaField): void {
    tocados[campo] = true
  }

  /** Al escribir, el aviso de éxito y el error que mandó el servidor para ese campo dejan de valer. */
  function alEditar(campo: ContrasenaField): void {
    ok.value = null
    if (erroresServidor.value[campo]) {
      const resto = { ...erroresServidor.value }
      delete resto[campo]
      erroresServidor.value = resto
    }
  }

  function limpiar(): void {
    form.actual = ''
    form.nueva = ''
    form.confirmacion = ''
    for (const campo of CAMPOS) tocados[campo] = false
    erroresServidor.value = {}
  }

  async function cambiar(): Promise<void> {
    ok.value = null
    submitError.value = null
    for (const campo of CAMPOS) tocados[campo] = true
    if (Object.keys(validarContrasena(form)).length > 0) return

    isSubmitting.value = true
    try {
      const { accessToken } = await cambiarContrasena({
        contrasenaActual: form.actual,
        contrasenaNueva: form.nueva,
      })
      limpiar()
      try {
        session.replaceToken(accessToken)
        ok.value = CONTRASENA_CAMBIADA
      } catch {
        // No debería pasar (el token es del mismo usuario). La contraseña sí
        // cambió, pero el token guardado es el viejo: el próximo 401 cierra
        // la sesión.
        submitError.value =
          'Tu contraseña cambió, pero no pudimos actualizar esta sesión. Vuelve a iniciar sesión.'
      }
    } catch (e) {
      const porCampo =
        e instanceof HttpError && e.status === 400
          ? erroresDelServidor(mensajesDeValidacion(e), mensajeDelBackend(e))
          : {}
      erroresServidor.value = porCampo
      submitError.value =
        Object.keys(porCampo).length > 0 ? null : mensajeDeError(e)
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    usuario,
    errores,
    isSubmitting,
    submitError,
    ok,
    marcarTocado,
    alEditar,
    cambiar,
  }
}
