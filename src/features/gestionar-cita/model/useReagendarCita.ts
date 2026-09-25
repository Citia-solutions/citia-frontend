import { computed, reactive, ref } from 'vue'
import { BLOQUES_HORARIOS } from '@/shared/config/bloquesHorarios'
import { aInicioISO, esMismoDia, fechaLocalISO, horaLocal } from '@/shared/lib/fecha'
import type { Appointment } from '@/entities/appointment'
import { reagendarCita } from '../api/gestionarCitaApi'
import { mensajeDeError, MOTIVO_MAX, statusDe } from './mensajeDeError'
import type { ReagendarCitaRequest, ResultadoAccion } from './types'

export interface ReagendarForm {
  fecha: string // 'YYYY-MM-DD'
  hora: string // 'HH:mm'
  motivo: string
}

/**
 * Caso de uso "reagendar": formulario prellenado con la fecha y hora actuales
 * de la cita, validación de futuro (el backend NO impide reagendar al pasado:
 * el front es la única barrera) y envío.
 *
 * Todo en zona del navegador, igual que `aInicioISO`: prellenado, validación y
 * envío usan la misma referencia, así que "misma hora" y "pasado" cuadran.
 */
export function useReagendarCita(appointment: Appointment) {
  const inicioActual = new Date(appointment.startsAt)

  const form = reactive<ReagendarForm>({
    fecha: fechaLocalISO(inicioActual),
    hora: horaLocal(inicioActual),
    motivo: '',
  })

  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  /** Hoy en zona local: `min` del selector de fecha. */
  const hoyISO = fechaLocalISO(new Date())

  /**
   * Bloques del modal de creación + la hora actual de la cita si no es un
   * bloque (p. ej. 10:30): así el `<select>` puede mostrarla prellenada sin
   * cambiar el control del modal de creación.
   */
  const opcionesHora = computed<string[]>(() => {
    const actual = horaLocal(inicioActual)
    if (BLOQUES_HORARIOS.includes(actual)) return [...BLOQUES_HORARIOS]
    return [...BLOQUES_HORARIOS, actual].sort()
  })

  /** Nuevo instante elegido, o null si falta fecha u hora. */
  const nuevoInicio = computed<Date | null>(() => {
    if (!form.fecha || !form.hora) return null
    try {
      return new Date(aInicioISO(form.fecha, form.hora))
    } catch {
      return null
    }
  })

  /** Mensaje de validación en vivo, o null si se puede enviar. */
  const errorValidacion = computed<string | null>(() => {
    const nuevo = nuevoInicio.value
    if (!nuevo) return 'Elige el nuevo día y la nueva hora.'
    if (nuevo.getTime() <= Date.now()) return 'Elige una fecha y hora futuras.'
    if (nuevo.getTime() === inicioActual.getTime()) return 'Es la misma hora que ya tiene la cita.'
    if (form.motivo.length > MOTIVO_MAX) return `El motivo no puede superar ${MOTIVO_MAX} caracteres.`
    return null
  })

  /** true si la nueva fecha no es hoy: la cita dejará de aparecer en la lista del día. */
  const saleDeHoy = computed(() => {
    const nuevo = nuevoInicio.value
    return nuevo !== null && !esMismoDia(nuevo, new Date())
  })

  async function submit(): Promise<ResultadoAccion | null> {
    if (errorValidacion.value || !nuevoInicio.value) return null
    // El computed no se recalcula con el paso del tiempo: se revisa de nuevo
    // al enviar por si el formulario quedó abierto hasta pasada esa hora.
    if (nuevoInicio.value.getTime() <= Date.now()) {
      submitError.value = 'Elige una fecha y hora futuras.'
      return null
    }

    submitError.value = null
    isSubmitting.value = true
    try {
      const motivo = form.motivo.trim()
      const payload: ReagendarCitaRequest = {
        inicio: aInicioISO(form.fecha, form.hora),
        ...(motivo ? { motivo } : {}),
      }
      const cita = await reagendarCita(appointment.id, payload)
      return { ok: true, cita }
    } catch (e) {
      const mensaje = mensajeDeError(e)
      submitError.value = mensaje
      return { ok: false, status: statusDe(e), mensaje }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    hoyISO,
    opcionesHora,
    nuevoInicio,
    errorValidacion,
    saleDeHoy,
    isSubmitting,
    submitError,
    submit,
  }
}
