import { computed, reactive, ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { mensajesDeValidacion } from '@/shared/api/erroresValidacion'
import {
  getConfiguracionRecordatorios,
  guardarConfiguracionRecordatorios,
} from '../api/configuracionRecordatoriosApi'
import {
  ANTELACIONES_SUGERIDAS,
  LIMITES_CONFIGURACION,
  erroresDelServidor,
  mismaConfiguracion,
  ordenarAntelaciones,
  toForm,
  toGuardarRequest,
  validarConfiguracion,
} from './configuracionSchema'
import type {
  ConfiguracionErrors,
  ConfiguracionField,
  ConfiguracionForm,
  ConfiguracionRecordatoriosDto,
} from './types'

const FORM_VACIO: ConfiguracionForm = {
  activo: true,
  antelacionesMin: [],
  telefonoContacto: '',
  correoRespuesta: '',
}

function mensajeDeCarga(e: unknown): string {
  if (!(e instanceof HttpError)) return 'No pudimos conectar con el servidor. Revisa tu conexión.'
  if (e.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  return 'No pudimos cargar tu configuración de recordatorios.'
}

function mensajeDeGuardado(e: unknown): string {
  if (!(e instanceof HttpError)) return 'No pudimos conectar con el servidor. Revisa tu conexión.'
  switch (e.status) {
    case 400:
      return 'Revisa los datos: el servidor los rechazó.'
    case 401:
      return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    default:
      return 'No se pudo guardar la configuración. Inténtalo de nuevo.'
  }
}

/**
 * Caso de uso "configurar recordatorios": carga la configuración del
 * profesional, la edita en un formulario y la guarda con un PUT (reemplazo
 * completo).
 *
 * - **Predeterminada:** mientras nunca guardó una, el backend devuelve la del
 *   entorno con `predeterminada: true`; la pantalla lo dice.
 * - **Cambios pendientes:** `hayCambios` compara contra lo último guardado;
 *   "Descartar" vuelve a eso.
 * - **Asíncrono:** guardar responde al instante, pero las citas futuras se
 *   reprograman en segundo plano (~5 s). El mensaje de éxito lo avisa.
 */
export function useConfiguracionRecordatorios() {
  const form = reactive<ConfiguracionForm>({ ...FORM_VACIO, antelacionesMin: [] })
  /** Lo último que devolvió el servidor (GET o PUT). */
  const guardada = ref<ConfiguracionRecordatoriosDto | null>(null)

  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const isSaving = ref(false)
  const saveError = ref<string | null>(null)
  const saveOk = ref<string | null>(null)

  /** Los errores de formato se muestran tras salir del campo o al intentar guardar. */
  const tocados = reactive<Record<ConfiguracionField, boolean>>({
    activo: false,
    antelacionesMin: false,
    telefonoContacto: false,
    correoRespuesta: false,
  })
  const erroresServidor = ref<ConfiguracionErrors>({})

  const predeterminada = computed(() => guardada.value?.predeterminada ?? false)

  const hayCambios = computed(() =>
    guardada.value ? !mismaConfiguracion(form, toForm(guardada.value)) : false,
  )

  /** true si al guardar se cambiaría el interruptor (para anticipar qué pasa). */
  const cambiaActivo = computed(() =>
    guardada.value ? guardada.value.activo !== form.activo : false,
  )

  const errores = computed<ConfiguracionErrors>(() => {
    const locales = validarConfiguracion(form)
    const visibles: ConfiguracionErrors = { ...erroresServidor.value }
    for (const campo of Object.keys(locales) as ConfiguracionField[]) {
      // Sin momentos elegidos se avisa al instante: el botón queda deshabilitado.
      if (tocados[campo] || campo === 'antelacionesMin') visibles[campo] = locales[campo]
    }
    return visibles
  })

  /** Momentos ofrecidos: los sugeridos + los que ya traía la configuración. */
  const opciones = computed<number[]>(() =>
    ordenarAntelaciones([...ANTELACIONES_SUGERIDAS, ...(guardada.value?.antelacionesMin ?? [])]),
  )

  const lleno = computed(
    () => form.antelacionesMin.length >= LIMITES_CONFIGURACION.maxAntelaciones,
  )

  function aplicar(dto: ConfiguracionRecordatoriosDto): void {
    guardada.value = dto
    Object.assign(form, toForm(dto))
    erroresServidor.value = {}
    for (const campo of Object.keys(tocados) as ConfiguracionField[]) tocados[campo] = false
  }

  function marcarTocado(campo: ConfiguracionField): void {
    tocados[campo] = true
  }

  /** Al editar un campo, el error que había mandado el servidor deja de valer. */
  function alEditar(campo: ConfiguracionField): void {
    saveOk.value = null
    if (erroresServidor.value[campo]) {
      const resto = { ...erroresServidor.value }
      delete resto[campo]
      erroresServidor.value = resto
    }
  }

  function seleccionada(min: number): boolean {
    return form.antelacionesMin.includes(min)
  }

  /** Marca o desmarca un momento; no deja pasar de 3. */
  function alternarAntelacion(min: number): void {
    alEditar('antelacionesMin')
    if (seleccionada(min)) {
      form.antelacionesMin = form.antelacionesMin.filter((m) => m !== min)
    } else if (!lleno.value) {
      form.antelacionesMin = ordenarAntelaciones([...form.antelacionesMin, min])
    }
  }

  async function cargar(): Promise<void> {
    loading.value = true
    loadError.value = null
    try {
      aplicar(await getConfiguracionRecordatorios())
    } catch (e) {
      loadError.value = mensajeDeCarga(e)
    } finally {
      loading.value = false
    }
  }

  function descartar(): void {
    if (guardada.value) aplicar(guardada.value)
    saveError.value = null
    saveOk.value = null
  }

  async function guardar(): Promise<void> {
    saveOk.value = null
    saveError.value = null
    for (const campo of Object.keys(tocados) as ConfiguracionField[]) tocados[campo] = true
    if (Object.keys(validarConfiguracion(form)).length > 0) return
    if (!hayCambios.value) return

    const eraActivo = guardada.value?.activo ?? true
    isSaving.value = true
    try {
      const nueva = await guardarConfiguracionRecordatorios(toGuardarRequest(form))
      aplicar(nueva)
      if (!nueva.activo) {
        saveOk.value =
          'Recordatorios desactivados. Los pendientes de tus próximas citas se anulan en unos segundos.'
      } else if (!eraActivo) {
        saveOk.value =
          'Recordatorios activados. Se programan para tus citas futuras en unos segundos.'
      } else {
        saveOk.value =
          'Configuración guardada. Tus citas ya agendadas se actualizan en unos segundos.'
      }
    } catch (e) {
      const porCampo = erroresDelServidor(mensajesDeValidacion(e))
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
    form,
    guardada,
    predeterminada,
    loading,
    loadError,
    isSaving,
    saveError,
    saveOk,
    hayCambios,
    cambiaActivo,
    errores,
    opciones,
    lleno,
    seleccionada,
    alternarAntelacion,
    marcarTocado,
    alEditar,
    cargar,
    descartar,
    guardar,
  }
}
