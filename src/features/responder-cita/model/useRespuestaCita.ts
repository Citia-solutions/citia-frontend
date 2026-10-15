import { ref } from 'vue'
import {
  cancelarHora,
  confirmarHora,
  obtenerVistaCita,
  pedirOtraHora as pedirOtraHoraApi,
} from '../api/respuestaCitaApi'
import { MENSAJE_NO_DISPONIBLE, mensajeDeError, statusDe } from './mensajeDeError'
import type {
  AccionPaciente,
  CancelarHoraRequest,
  PedirOtraHoraRequest,
  VistaCitaPacienteDto,
} from './types'

/**
 * - `cargando`: pidiendo la vista.
 * - `lista`: hay una hora que mostrar.
 * - `invalido`: sin token, o el backend respondió 404 (inválido, invalidado,
 *   cita terminal o ya pasada: el mismo 404 para todo, y la misma pantalla).
 * - `error`: no se pudo cargar por otra razón (red, 429, 5xx); se puede reintentar.
 */
export type EstadoCarga = 'cargando' | 'lista' | 'invalido' | 'error'

/** Qué muestra la tarjeta cuando hay hora: el resumen o uno de los dos formularios. */
export type Pantalla = 'resumen' | 'cancelar' | 'otraHora'

/** Mensaje sobre el resumen tras una acción: éxito, o "ya no está disponible" (409). */
export interface AvisoRespuesta {
  tipo: 'exito' | 'info'
  textos: string[]
}

const EXITO_CONFIRMAR = ['¡Listo! Confirmaste tu hora. Te esperamos.']
const EXITO_CANCELAR = [
  'Cancelaste tu hora.',
  'Este enlace ya no sirve para hacer más cambios. Si necesitas una hora nueva, contacta a tu profesional.',
]
const EXITO_OTRA_HORA = ['Recibimos tu pedido de otra hora.']

/**
 * Caso de uso de la página `/cita#<token>`: cargar la hora del paciente y
 * responder (confirmar, cancelar, pedir otra hora).
 *
 * - **El token vive solo en memoria** (este closure). No se guarda en
 *   `localStorage`, `sessionStorage` ni en un store: la URL limpia ya no lo
 *   tiene, así que recargar la página lleva a "enlace no válido".
 * - **Cargar nunca ejecuta una acción**: `cargar` solo hace el GET. Cada POST
 *   lo dispara un clic (`confirmar`, `cancelar`, `pedirOtraHora`).
 * - Cada acción exitosa devuelve la vista nueva, que reemplaza a la anterior
 *   (no se vuelve a pedir).
 * - 404 en cualquier momento → pantalla de enlace no válido. 409 → se recarga
 *   la vista y se avisa "Esta acción ya no está disponible". 429, red, 400 y
 *   5xx → mensaje en la pantalla actual, conservando lo escrito.
 */
export function useRespuestaCita(token: string | null) {
  const estado = ref<EstadoCarga>(token ? 'cargando' : 'invalido')
  const cita = ref<VistaCitaPacienteDto | null>(null)
  const pantalla = ref<Pantalla>('resumen')
  const aviso = ref<AvisoRespuesta | null>(null)
  /** Mensaje de la pantalla `error`. */
  const errorCarga = ref<string | null>(null)
  /** Acción en curso (una a la vez); null si no se está enviando nada. */
  const enviando = ref<AccionPaciente | null>(null)
  /** Fallo de la última acción que no cambió de pantalla (429, red, 400, 5xx). */
  const errorAccion = ref<string | null>(null)

  function marcarInvalido(): void {
    cita.value = null
    aviso.value = null
    errorAccion.value = null
    pantalla.value = 'resumen'
    estado.value = 'invalido'
  }

  /** Pide la vista (al abrir y en "Reintentar"). Sin token no llama a la API. */
  async function cargar(): Promise<void> {
    if (!token) {
      marcarInvalido()
      return
    }
    estado.value = 'cargando'
    errorCarga.value = null
    try {
      cita.value = await obtenerVistaCita(token)
      estado.value = 'lista'
    } catch (e) {
      if (statusDe(e) === 404) {
        marcarInvalido()
      } else {
        errorCarga.value = mensajeDeError(e)
        estado.value = 'error'
      }
    }
  }

  /**
   * Tras un 409: vuelve a pedir la vista sin pasar por "cargando" (la tarjeta
   * sigue a la vista). Si ahora es 404, el enlace dejó de valer; si falla por
   * otra razón, se queda lo que había.
   */
  async function recargar(enlace: string): Promise<void> {
    try {
      cita.value = await obtenerVistaCita(enlace)
    } catch (e) {
      if (statusDe(e) === 404) marcarInvalido()
    }
  }

  async function ejecutar(
    accion: AccionPaciente,
    llamada: (enlace: string) => Promise<VistaCitaPacienteDto>,
    exito: string[],
  ): Promise<boolean> {
    if (!token || enviando.value) return false
    enviando.value = accion
    errorAccion.value = null
    try {
      cita.value = await llamada(token)
      pantalla.value = 'resumen'
      aviso.value = { tipo: 'exito', textos: exito }
      return true
    } catch (e) {
      const status = statusDe(e)
      if (status === 404) {
        marcarInvalido()
      } else if (status === 409) {
        pantalla.value = 'resumen'
        aviso.value = { tipo: 'info', textos: [MENSAJE_NO_DISPONIBLE] }
        await recargar(token)
      } else {
        errorAccion.value = mensajeDeError(e)
      }
      return false
    } finally {
      enviando.value = null
    }
  }

  /** "Confirmar mi hora": un clic, sin paso intermedio. */
  function confirmar(): Promise<boolean> {
    return ejecutar('confirmar', confirmarHora, EXITO_CONFIRMAR)
  }

  /** "Sí, cancelar mi hora" (tras el paso de confirmación). Motivo opcional. */
  function cancelar(motivo: string): Promise<boolean> {
    const texto = motivo.trim()
    const payload: CancelarHoraRequest = texto ? { motivo: texto } : {}
    return ejecutar('cancelar', (enlace) => cancelarHora(enlace, payload), EXITO_CANCELAR)
  }

  /** "Enviar pedido" del formulario de otra hora. */
  function pedirOtraHora(preferencia: string, motivo: string): Promise<boolean> {
    const texto = motivo.trim()
    const payload: PedirOtraHoraRequest = {
      preferencia: preferencia.trim(),
      ...(texto ? { motivo: texto } : {}),
    }
    return ejecutar('pedirOtraHora', (enlace) => pedirOtraHoraApi(enlace, payload), EXITO_OTRA_HORA)
  }

  /** Cambia de pantalla (no mientras se envía). Limpia el aviso y el error anteriores. */
  function irA(destino: Pantalla): void {
    if (enviando.value) return
    aviso.value = null
    errorAccion.value = null
    pantalla.value = destino
  }

  return {
    estado,
    cita,
    pantalla,
    aviso,
    errorCarga,
    enviando,
    errorAccion,
    cargar,
    confirmar,
    cancelar,
    pedirOtraHora,
    irA,
  }
}
