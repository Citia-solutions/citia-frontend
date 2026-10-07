import { computed, reactive, ref } from 'vue'
import { BLOQUES_HORARIOS, errorFinDeJornada } from '@/shared/config/bloquesHorarios'
import {
  aFechaISO,
  aInicioISO,
  esDiaPasado,
  esInicioPasado,
  fechaEnClinicaISO,
  partesDeFecha,
} from '@/shared/lib/fecha'
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

/** Mismo texto que el modal "Nueva cita" y reagendar. */
const MSG_INICIO_PASADO = 'Elige una fecha y hora futuras.'

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
 * El año se toma del de `recibidaEn` (en la zona de la clínica); si ese día ya
 * había pasado cuando llegó la solicitud, se asume el año siguiente (una
 * preferencia de enero enviada en diciembre).
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
  const base = fechaEnClinicaISO(Number.isNaN(recibida.getTime()) ? new Date() : recibida)
  const anio = anioTxt ? Number(anioTxt) : partesDeFecha(base)[0]
  // `aFechaISO` da null si el día no existe (31 de septiembre).
  let fecha = aFechaISO(anio, mes, dia)
  if (!fecha) return null
  if (!anioTxt && fecha < base) fecha = aFechaISO(anio + 1, mes, dia)
  if (!fecha) return null

  const hora = `${String(Number(hTxt)).padStart(2, '0')}:${minTxt}`
  return { fecha, hora }
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

  /** Hoy en la zona de la clínica: `min` del selector de fecha. Se renueva al abrir. */
  const hoyISO = ref(fechaEnClinicaISO(new Date()))

  /** Bloques del modal de creación + la hora sugerida si no es un bloque. */
  const opcionesHora = computed<string[]>(() => {
    if (!form.hora || BLOQUES_HORARIOS.includes(form.hora)) return [...BLOQUES_HORARIOS]
    return [...BLOQUES_HORARIOS, form.hora].sort()
  })

  /** Prepara el formulario para una solicitud (al abrir el modal). */
  function reset(solicitud: Solicitud): void {
    solicitudId = solicitud.id
    hoyISO.value = fechaEnClinicaISO(new Date())
    const sugerencia = sugerirInicio(solicitud.preferenciaHoraria, solicitud.recibidaEn)
    // Solo se precarga si la sugerencia sigue siendo futura: proponer una hora
    // que ya pasó obligaría a borrarla.
    const usarSugerencia = sugerencia !== null && !esInicioPasado(sugerencia.fecha, sugerencia.hora)
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
      // Misma regla que el modal "Nueva cita" y reagendar, en hora de la
      // clínica: ni un día pasado ni una hora de hoy que ya pasó.
      try {
        aInicioISO(form.fecha, form.hora)
        if (esDiaPasado(form.fecha)) e.fecha = MSG_INICIO_PASADO
        else if (esInicioPasado(form.fecha, form.hora)) e.hora = MSG_INICIO_PASADO
      } catch {
        e.fecha = 'La fecha u hora no es válida.'
      }
    }
    const d = form.duracionMin
    if (!Number.isInteger(d) || d < 1 || d > DURACION_MAXIMA_MIN) {
      e.duracionMin = `La duración debe ser un número entero entre 1 y ${DURACION_MAXIMA_MIN} minutos.`
    } else if (form.hora && !e.hora) {
      // Misma regla que el modal "Nueva cita": la última cita termina a `FIN_DE_JORNADA`.
      const finDeJornada = errorFinDeJornada(form.hora, d)
      if (finDeJornada) e.hora = finDeJornada
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
