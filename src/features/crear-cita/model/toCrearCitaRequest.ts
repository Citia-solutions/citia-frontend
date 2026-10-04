import { aInicioISO } from '@/shared/lib/fecha'
import { normalizarRut } from '@/shared/lib/rut'
import type { CrearCitaRequest, NuevaCitaForm } from './types'

// `aInicioISO` vive en `shared/lib/fecha` (la usa también reagendar). Se
// reexporta para no romper a quien la importaba desde este feature.
export { aInicioISO }

/**
 * Traduce el formulario al cuerpo que espera `POST /citas`.
 *
 * Tres cosas que no son obvias:
 *  - el `motivo` del formulario viaja como `tipoConsulta`, que es el campo con
 *    el que el backend describe de qué va la cita;
 *  - el `correo` viaja SIEMPRE: es obligatorio desde la Fase 2 (sin él no hay
 *    recordatorios). Se manda recortado; el backend además lo pasa a minúsculas;
 *  - el RUT, opcional, se omite si está vacío en vez de enviarse como `''`,
 *    porque el backend valida formato cuando el campo está presente.
 */
export function toCrearCitaRequest(form: NuevaCitaForm): CrearCitaRequest {
  const rut = form.rut.trim()

  return {
    inicio: aInicioISO(form.fecha, form.hora),
    duracionMin: form.duracionMin,
    tipoConsulta: form.motivo.trim(),
    paciente: {
      ...(rut ? { rut: normalizarRut(rut) } : {}),
      nombre: form.pacienteNombre.trim(),
      telefono: form.telefono.trim(),
      correo: form.correo.trim(),
      consentimiento: form.consentimiento,
    },
  }
}
