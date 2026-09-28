import { computed, reactive, ref } from 'vue'
import { BLOQUES_HORARIOS } from '@/shared/config/bloquesHorarios'
import { aInicioISO, fechaLocalISO } from '@/shared/lib/fecha'
import type { Solicitud } from '@/entities/solicitud'
import { aceptarSolicitud } from '../api/bandejaApi'
import { DURACION_MAXIMA_MIN, mensajeDeError, statusDe } from './mensajeDeError'
import type { AceptarSolicitudRequest, ResultadoResolucion, SolicitudAceptada } from './types'

export interface AceptarForm {
  fecha: string // 'YYYY-MM-DD'
  hora: string // 'HH:mm'
  duracionMin: number
  tipoConsulta: string
}

export type AceptarField = keyof AceptarForm
export type AceptarErrors = Partial<Record<AceptarField, string>>

/** Duración por defecto, la misma del modal "Nueva cita". */
const DURACION_POR_DEFECTO = 30

const MESES: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
}

/**
 * Intenta leer día y hora de la preferencia que armó el flujo público
 * (`aPreferenciaHoraria`: 'viernes, 18 de septiembre a las 10:00') para
 * PRECARGAR el formulario. Es solo una sugerencia: la preferencia es texto
 * libre, no trae año y no reserva nada. Si no calza, se deja vacío.
 *
 * El año se toma del de `recibidaEn`; si ese día ya había pasado cuando llegó
 * la solicitud, se asume el año siguiente (una preferencia de enero enviada en
 * diciembre).
 */
export function sugerirInicio(
  preferencia: string,
  recibidaEn: string,
): { fecha: string; hora: string } | null {
  const m = /(\d{1,2}) de ([a-záéíóú]+)(?: de (\d{4}))? a las (\d{1,2}):(\d{2})/i.exec(preferencia)
  if (!m) return null
  const [, diaTxt, mesTxt, anioTxt, hTxt, minTxt] = m
  const mes = MESES[(mesTxt ?? '').toLowerCase()]
  const dia = Number(diaTxt)
  if (!mes || !dia) return null

  const recibida = new Date(recibidaEn)
  const base = Number.isNaN(recibida.getTime()) ? new Date() : recibida
  let anio = anioTxt ? Number(anioTxt) : base.getFullYear()
  const candidata = new Date(anio, mes - 1, dia)
  // Fecha inexistente (31 de septiembre): Date la corre al mes siguiente.
  if (candidata.getMonth() !== mes - 1) return null
  if (!anioTxt && fechaLocalISO(candidata) < fechaLocalISO(base)) anio += 1

  const hora = `${String(Number(hTxt)).padStart(2, '0')}:${minTxt}`
  return { fecha: fechaLocalISO(new Date(anio, mes - 1, dia)), hora }
}

/**
 * Caso de uso "aceptar una solicitud": el profesional fija la hora REAL de la
 * cita (la del paciente era una preferencia), su duración y el tipo de consulta
 * (precargado con el motivo, ADR-09 §10).
 *
 * Mismas reglas de la interfaz que reagendar: `inicio` con zona explícita
 * (`aInicioISO`), y no se acepta al pasado desde la UI — el backend lo
 * permitiría en silencio (DT-13).
 */
export function useAceptarSolicitud() {
  const form = reactive<AceptarForm>({
    fecha: '',
    hora: '',
    duracionMin: DURACION_POR_DEFECTO,
    tipoConsulta: '',
  })
  const errors = ref<AceptarErrors>({})
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)
  /** true si fecha y hora se precargaron desde la preferencia del paciente. */
  const sugerida = ref(false)
  let solicitudId = ''

  /** Hoy en zona local: `min` del selector de fecha. */
  const hoyISO = computed(() => fechaLocalISO(new Date()))

  /** Bloques del modal de creación + la hora sugerida si no es un bloque. */
  const opcionesHora = computed<string[]>(() => {
    if (!form.hora || BLOQUES_HORARIOS.includes(form.hora)) return [...BLOQUES_HORARIOS]
    return [...BLOQUES_HORARIOS, form.hora].sort()
  })

  /** Prepara el formulario para una solicitud (al abrir el modal). */
  function reset(solicitud: Solicitud): void {
    solicitudId = solicitud.id
    const sugerencia = sugerirInicio(solicitud.preferenciaHoraria, solicitud.recibidaEn)
    // Solo se precarga si la sugerencia sigue siendo futura: proponer una hora
    // que ya pasó obligaría a borrarla.
    let usarSugerencia = false
    if (sugerencia) {
      try {
        usarSugerencia = new Date(aInicioISO(sugerencia.fecha, sugerencia.hora)).getTime() > Date.now()
      } catch {
        usarSugerencia = false
      }
    }
    Object.assign(form, {
      fecha: usarSugerencia && sugerencia ? sugerencia.fecha : '',
      hora: usarSugerencia && sugerencia ? sugerencia.hora : '',
      duracionMin: DURACION_POR_DEFECTO,
      tipoConsulta: solicitud.motivo.trim(),
    })
    sugerida.value = usarSugerencia
    errors.value = {}
    submitError.value = null
    isSubmitting.value = false
  }

  function validar(): AceptarErrors {
    const e: AceptarErrors = {}
    if (!form.fecha) e.fecha = 'Selecciona la fecha.'
    if (!form.hora) e.hora = 'Selecciona la hora.'
    if (form.fecha && form.hora) {
      try {
        if (new Date(aInicioISO(form.fecha, form.hora)).getTime() <= Date.now()) {
          e.fecha = 'Elige una fecha y hora futuras.'
        }
      } catch {
        e.fecha = 'La fecha u hora no es válida.'
      }
    }
    const d = form.duracionMin
    if (!Number.isInteger(d) || d < 1 || d > DURACION_MAXIMA_MIN) {
      e.duracionMin = `La duración debe ser un número entero entre 1 y ${DURACION_MAXIMA_MIN} minutos.`
    }
    if (!form.tipoConsulta.trim()) e.tipoConsulta = 'Indica el tipo de consulta.'
    return e
  }

  async function submit(): Promise<ResultadoResolucion<SolicitudAceptada> | null> {
    submitError.value = null
    errors.value = validar()
    if (Object.keys(errors.value).length > 0) return null

    isSubmitting.value = true
    try {
      const payload: AceptarSolicitudRequest = {
        inicio: aInicioISO(form.fecha, form.hora),
        duracionMin: form.duracionMin,
        tipoConsulta: form.tipoConsulta.trim(),
      }
      const valor = await aceptarSolicitud(solicitudId, payload)
      return { ok: true, valor }
    } catch (e) {
      const mensaje = mensajeDeError(e, 'aceptar')
      submitError.value = mensaje
      return { ok: false, status: statusDe(e), mensaje }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    errors,
    isSubmitting,
    submitError,
    sugerida,
    hoyISO,
    opcionesHora,
    reset,
    submit,
  }
}
