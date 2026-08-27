import { esRutValido } from '@/shared/lib/rut'
import type { NuevaCitaErrors, NuevaCitaForm } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9 ()-]+$/

/**
 * Validación mínima sin librería externa (mismo estilo que loginSchema.ts).
 * Si el proyecto adopta zod/yup más adelante, este archivo es el único punto a cambiar.
 *
 * Refleja lo que el backend exige, para no descubrir un 400 después de enviar.
 * El servidor sigue siendo la autoridad: esto es solo para no hacerle perder
 * el viaje al usuario.
 */
export function validateNuevaCita(values: NuevaCitaForm): NuevaCitaErrors {
  const errors: NuevaCitaErrors = {}

  if (!values.pacienteNombre.trim()) {
    errors.pacienteNombre = 'Ingresa el nombre del paciente.'
  }

  // El RUT es opcional (hay pacientes sin documento chileno), pero si viene
  // tiene que ser válido: es la identidad con la que se evita duplicarlo.
  if (values.rut.trim() && !esRutValido(values.rut)) {
    errors.rut = 'El RUT no es válido. Revisa el dígito verificador.'
  }

  if (!values.telefono.trim()) {
    errors.telefono = 'Ingresa el teléfono.'
  } else if (!PHONE_RE.test(values.telefono.trim())) {
    errors.telefono = 'El teléfono no es válido.'
  }

  if (values.correo.trim() && !EMAIL_RE.test(values.correo.trim())) {
    errors.correo = 'El correo no es válido.'
  }

  if (!values.fecha) {
    errors.fecha = 'Selecciona la fecha.'
  }

  if (!values.hora) {
    errors.hora = 'Selecciona el bloque horario.'
  }

  if (!values.duracionMin || values.duracionMin <= 0) {
    errors.duracionMin = 'Selecciona la duración.'
  }

  // El backend lo recibe como `tipoConsulta` y no acepta vacío.
  if (!values.motivo.trim()) {
    errors.motivo = 'Indica el motivo de la consulta.'
  }

  if (!values.consentimiento) {
    errors.consentimiento =
      'Se necesita el consentimiento del paciente para poder contactarlo.'
  }

  return errors
}
