import { normalizarRut } from '@/shared/lib/rut'
import type { CrearCitaRequest, NuevaCitaForm } from './types'

/**
 * Combina fecha ('YYYY-MM-DD') y hora ('HH:mm') en un instante ISO con zona
 * explícita.
 *
 * Se construye con componentes locales (`new Date(a, m, d, h, min)`) a
 * propósito: si se pasara la cadena `'2026-08-25T14:00'` el navegador la
 * interpretaría como UTC y la cita quedaría corrida varias horas. Al armarla
 * por componentes se usa la zona del navegador —la del profesional— y
 * `toISOString()` la serializa como instante absoluto terminado en `Z`.
 *
 * El backend guarda instantes y proyecta a la zona de la clínica al mostrar,
 * así que mandar el instante explícito es exactamente lo que espera.
 */
export function aInicioISO(fecha: string, hora: string): string {
  const partesFecha = fecha.split('-')
  const partesHora = hora.split(':')

  const anio = Number(partesFecha[0])
  const mes = Number(partesFecha[1])
  const dia = Number(partesFecha[2])
  const horas = Number(partesHora[0])
  const minutos = Number(partesHora[1])

  if ([anio, mes, dia, horas, minutos].some(Number.isNaN)) {
    throw new Error(`Fecha u hora con formato inesperado: "${fecha}" "${hora}"`)
  }

  return new Date(anio, mes - 1, dia, horas, minutos, 0, 0).toISOString()
}

/**
 * Traduce el formulario al cuerpo que espera `POST /citas`.
 *
 * Dos cosas que no son obvias:
 *  - el `motivo` del formulario viaja como `tipoConsulta`, que es el campo con
 *    el que el backend describe de qué va la cita;
 *  - los campos vacíos se omiten en vez de enviarse como `''`, porque el
 *    backend valida formato cuando el campo está presente (un correo vacío
 *    sería un correo inválido, no un correo ausente).
 */
export function toCrearCitaRequest(form: NuevaCitaForm): CrearCitaRequest {
  const rut = form.rut.trim()
  const correo = form.correo.trim()

  return {
    inicio: aInicioISO(form.fecha, form.hora),
    duracionMin: form.duracionMin,
    tipoConsulta: form.motivo.trim(),
    paciente: {
      ...(rut ? { rut: normalizarRut(rut) } : {}),
      nombre: form.pacienteNombre.trim(),
      telefono: form.telefono.trim(),
      ...(correo ? { correo } : {}),
      consentimiento: form.consentimiento,
    },
  }
}
