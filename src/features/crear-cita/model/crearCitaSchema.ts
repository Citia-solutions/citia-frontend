import type { NuevaCitaErrors, NuevaCitaForm } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9 ()-]+$/

/**
 * Validación mínima sin librería externa (mismo estilo que loginSchema.ts).
 * Si el proyecto adopta zod/yup más adelante, este archivo es el único punto a cambiar.
 */
export function validateNuevaCita(values: NuevaCitaForm): NuevaCitaErrors {
  const errors: NuevaCitaErrors = {}

  if (!values.pacienteNombre.trim()) {
    errors.pacienteNombre = 'Ingresa el nombre del paciente.'
  }

  if (!values.correo.trim()) {
    errors.correo = 'Ingresa el correo electrónico.'
  } else if (!EMAIL_RE.test(values.correo.trim())) {
    errors.correo = 'El correo no es válido.'
  }

  if (values.telefono.trim() && !PHONE_RE.test(values.telefono.trim())) {
    errors.telefono = 'El teléfono no es válido.'
  }

  if (!values.fecha) {
    errors.fecha = 'Selecciona la fecha.'
  }

  if (!values.hora) {
    errors.hora = 'Selecciona el bloque horario.'
  }

  return errors
}
