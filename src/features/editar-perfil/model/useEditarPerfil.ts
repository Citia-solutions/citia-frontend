import { computed, reactive, ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { mensajeDelBackend, mensajesDeValidacion } from '@/shared/api/erroresValidacion'
import { useSessionStore } from '@/entities/session'
import { actualizarPerfil, getPerfil } from '../api/perfilApi'
import { erroresDelServidor, toForm, validarPerfil } from './perfilSchema'
import type { ActualizarPerfilRequest, Perfil, PerfilErrors, PerfilField, PerfilForm } from './types'

const SIN_CONEXION = 'No pudimos conectar con el servidor. Revisa tu conexión.'
const SESION_EXPIRADA = 'Tu sesión expiró. Vuelve a iniciar sesión.'

function mensajeDeCarga(e: unknown): string {
  if (!(e instanceof HttpError)) return SIN_CONEXION
  if (e.status === 401) return SESION_EXPIRADA
  return 'No pudimos cargar tu perfil.'
}

function mensajeDeGuardado(e: unknown): string {
  if (!(e instanceof HttpError)) return SIN_CONEXION
  switch (e.status) {
    case 400:
      // Un texto de dominio que no nombra un campo conocido va tal cual.
      return mensajeDelBackend(e) ?? 'Revisa los datos: el servidor los rechazó.'
    case 401:
      return SESION_EXPIRADA
    case 429:
      return mensajeDelBackend(e) ?? 'Demasiados intentos, prueba en unos minutos.'
    default:
      return 'No se pudo guardar tu perfil. Inténtalo de nuevo.'
  }
}

/**
 * Caso de uso "editar perfil" (US-10): carga el perfil del usuario logueado y
 * edita su nombre y su especialidad.
 *
 * - **Sesión al día (F5):** con el `GET` y con el `PATCH` 200 refresca la
 *   sesión (`updateUser`): el sidebar y el enlace de agenda cambian solos. En
 *   ningún otro lugar se pide el perfil.
 * - **Solo lo que cambió:** el `PATCH` lleva únicamente los campos distintos
 *   de lo guardado; la especialidad vacía viaja como `null` (la borra).
 * - **Errores (F6):** se valida antes de enviar; un 400 que llega igual se
 *   muestra junto a su campo.
 */
export function useEditarPerfil() {
  const session = useSessionStore()

  /** Lo último que devolvió el servidor (GET o PATCH). */
  const perfil = ref<Perfil | null>(null)
  const form = reactive<PerfilForm>({ nombreCompleto: '', especialidad: '' })

  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const isSaving = ref(false)
  const saveError = ref<string | null>(null)
  const saveOk = ref<string | null>(null)

  /** Los errores de formato se muestran tras salir del campo o al intentar guardar. */
  const tocados = reactive<Record<PerfilField, boolean>>({
    nombreCompleto: false,
    especialidad: false,
  })
  const erroresServidor = ref<PerfilErrors>({})

  const nombreCambio = computed(
    () => perfil.value !== null && form.nombreCompleto.trim() !== perfil.value.nombreCompleto,
  )
  const especialidadCambio = computed(
    () => perfil.value !== null && form.especialidad.trim() !== (perfil.value.especialidad ?? ''),
  )
  const hayCambios = computed(() => nombreCambio.value || especialidadCambio.value)

  const errores = computed<PerfilErrors>(() => {
    const locales = validarPerfil(form)
    const visibles: PerfilErrors = { ...erroresServidor.value }
    for (const campo of Object.keys(locales) as PerfilField[]) {
      if (tocados[campo]) visibles[campo] = locales[campo]
    }
    return visibles
  })

  function aplicar(nuevo: Perfil): void {
    perfil.value = nuevo
    Object.assign(form, toForm(nuevo))
    erroresServidor.value = {}
    tocados.nombreCompleto = false
    tocados.especialidad = false
    session.updateUser({
      name: nuevo.nombreCompleto,
      tenantSlug: nuevo.tenantSlug,
      tenantNombre: nuevo.tenantNombre,
    })
  }

  function marcarTocado(campo: PerfilField): void {
    tocados[campo] = true
  }

  /** Al editar un campo, el aviso de éxito y el error que mandó el servidor dejan de valer. */
  function alEditar(campo: PerfilField): void {
    saveOk.value = null
    if (erroresServidor.value[campo]) {
      const resto = { ...erroresServidor.value }
      delete resto[campo]
      erroresServidor.value = resto
    }
  }

  async function cargar(): Promise<void> {
    loading.value = true
    loadError.value = null
    try {
      aplicar(await getPerfil())
    } catch (e) {
      loadError.value = mensajeDeCarga(e)
    } finally {
      loading.value = false
    }
  }

  function descartar(): void {
    if (perfil.value) Object.assign(form, toForm(perfil.value))
    erroresServidor.value = {}
    tocados.nombreCompleto = false
    tocados.especialidad = false
    saveError.value = null
    saveOk.value = null
  }

  async function guardar(): Promise<void> {
    saveOk.value = null
    saveError.value = null
    tocados.nombreCompleto = true
    tocados.especialidad = true
    if (Object.keys(validarPerfil(form)).length > 0) return
    if (!hayCambios.value) return

    const payload: ActualizarPerfilRequest = {
      ...(nombreCambio.value ? { nombreCompleto: form.nombreCompleto.trim() } : {}),
      ...(especialidadCambio.value ? { especialidad: form.especialidad.trim() || null } : {}),
    }

    isSaving.value = true
    try {
      aplicar(await actualizarPerfil(payload))
      saveOk.value = 'Cambios guardados.'
    } catch (e) {
      const status = e instanceof HttpError ? e.status : null
      const porCampo =
        status === 400 ? erroresDelServidor(mensajesDeValidacion(e), mensajeDelBackend(e)) : {}
      erroresServidor.value = porCampo
      saveError.value =
        Object.keys(porCampo).length > 0
          ? 'Revisa los campos marcados: el servidor los rechazó.'
          : mensajeDeGuardado(e)
    } finally {
      isSaving.value = false
    }
  }

  return {
    perfil,
    form,
    loading,
    loadError,
    isSaving,
    saveError,
    saveOk,
    hayCambios,
    errores,
    marcarTocado,
    alEditar,
    cargar,
    descartar,
    guardar,
  }
}
