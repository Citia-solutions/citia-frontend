import { computed, reactive, ref } from 'vue'
import { BLOQUES_HORARIOS, errorFinDeJornada } from '@/shared/config/bloquesHorarios'
import { aInicioISO, esMismoDia, fechaEnClinicaISO, horaEnClinica } from '@/shared/lib/fecha'
import type { Appointment } from '@/entities/appointment'
import { reagendarCita } from '../api/gestionarCitaApi'
import { mensajeDeError, MOTIVO_MAX, PEDIDO_POR_REQUERIDO, statusDe } from './mensajeDeError'
import type { PedidoPor, ReagendarCitaRequest, ResultadoAccion } from './types'

export interface ReagendarForm {
  fecha: string // 'YYYY-MM-DD'
  hora: string // 'HH:mm'
  motivo: string
  /** "¿Quién lo pidió?" (US-07.01). null hasta que se responde: sin respuesta no se envía. */
  pedidoPor: PedidoPor | null
}

/**
 * Caso de uso "reagendar": formulario prellenado con la fecha y hora actuales
 * de la cita, validación de futuro (el backend NO impide reagendar al pasado:
 * el front es la única barrera), "¿Quién lo pidió?" y envío.
 *
 * Todo en la zona de la clínica, igual que `aInicioISO`: prellenado, validación
 * y envío usan la misma referencia, así que "misma hora" y "pasado" cuadran
 * aunque el navegador esté en otra zona.
 *
 * "¿Quién lo pidió?" (US-07.01) se valida aparte (`errorPedidoPor`): así la
 * vista sigue mostrando la nueva hora elegida mientras esa pregunta falta.
 */
export function useReagendarCita(appointment: Appointment) {
  const inicioActual = new Date(appointment.startsAt)

  const form = reactive<ReagendarForm>({
    fecha: fechaEnClinicaISO(inicioActual),
    hora: horaEnClinica(inicioActual),
    motivo: '',
    pedidoPor: null,
  })

  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  /** Hoy en la zona de la clínica: `min` del selector de fecha. */
  const hoyISO = fechaEnClinicaISO(new Date())

  /**
   * Bloques del modal de creación + la hora actual de la cita si no es un
   * bloque (p. ej. 10:30): así el `<select>` puede mostrarla prellenada sin
   * cambiar el control del modal de creación.
   */
  const opcionesHora = computed<string[]>(() => {
    const actual = horaEnClinica(inicioActual)
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
    // Misma regla que al crear: la última cita termina a `FIN_DE_JORNADA`.
    // Reagendar conserva la duración, así que solo se puede mover la hora.
    const finDeJornada = errorFinDeJornada(form.hora, appointment.durationMin, 'Elige una hora más temprana.')
    if (finDeJornada) return finDeJornada
    if (form.motivo.length > MOTIVO_MAX) return `El motivo no puede superar ${MOTIVO_MAX} caracteres.`
    return null
  })

  /** Aviso mientras "¿Quién lo pidió?" no tiene respuesta, o null. */
  const errorPedidoPor = computed<string | null>(() =>
    form.pedidoPor === null ? PEDIDO_POR_REQUERIDO : null,
  )

  /** true si la nueva fecha no es hoy: la cita dejará de aparecer en la lista del día. */
  const saleDeHoy = computed(() => {
    const nuevo = nuevoInicio.value
    return nuevo !== null && !esMismoDia(nuevo, new Date())
  })

  async function submit(): Promise<ResultadoAccion | null> {
    const pedidoPor = form.pedidoPor
    if (errorValidacion.value || !nuevoInicio.value || pedidoPor === null) return null
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
        pedidoPor,
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
    errorPedidoPor,
    saleDeHoy,
    isSubmitting,
    submitError,
    submit,
  }
}
