import { errorFinDeJornada } from '@/shared/config/bloquesHorarios'
import { esRutValido } from '@/shared/lib/rut'
import type { NuevaCitaErrors, NuevaCitaField, NuevaCitaForm } from './types'

/**
 * Correo con al menos un punto en el dominio y un final de 2+ caracteres:
 * `a@b.c` lo rechaza también el `@IsEmail()` del backend.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9 ()-]+$/

/**
 * Largo máximo del correo del paciente: espejo de `@MaxLength(254)` en
 * `CrearPacienteDto` del backend (máximo de una dirección, RFC 5321). Mismo
 * patrón que DTF-06: si cambia allá, cambia acá.
 */
export const CORREO_MAX = 254

const MSG_CORREO_REQUERIDO = 'Ingresa el correo del paciente: ahí le llegan los recordatorios.'
const MSG_CORREO_INVALIDO = 'El correo no es válido. Revisa que esté bien escrito (ej: nombre@correo.cl).'
const MSG_CORREO_LARGO = `El correo no puede superar los ${CORREO_MAX} caracteres.`

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

  // Obligatorio desde la Fase 2 (ADR-13 §14 del backend): sin correo no hay
  // recordatorios, y el backend responde 400 si falta.
  const correo = values.correo.trim()
  if (!correo) {
    errors.correo = MSG_CORREO_REQUERIDO
  } else if (correo.length > CORREO_MAX) {
    errors.correo = MSG_CORREO_LARGO
  } else if (!EMAIL_RE.test(correo)) {
    errors.correo = MSG_CORREO_INVALIDO
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

  // La última cita termina a las 22:00 (`FIN_DE_JORNADA`, decisión del
  // 2026-10-05): con el bloque de las 21:00, una cita de 90 min no cabe. El
  // backend no lo impide; es una regla de la interfaz, igual que no agendar al pasado.
  if (values.hora && !errors.hora && !errors.duracionMin) {
    const finDeJornada = errorFinDeJornada(values.hora, values.duracionMin)
    if (finDeJornada) errors.hora = finDeJornada
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

/** Propiedad del cuerpo de `POST /citas` → campo del formulario. */
const CAMPO_DEL_BACKEND: ReadonlyArray<[prefijo: string, campo: NuevaCitaField]> = [
  ['paciente.correo', 'correo'],
  ['paciente.telefono', 'telefono'],
  ['paciente.rut', 'rut'],
  ['paciente.nombre', 'pacienteNombre'],
  ['paciente.consentimiento', 'consentimiento'],
  ['tipoConsulta', 'motivo'],
  ['duracionMin', 'duracionMin'],
  ['inicio', 'fecha'],
]

/** Texto para el correo según la regla de class-validator que falló. */
function mensajeCorreo(mensaje: string): string {
  if (mensaje.includes('should not be empty')) return MSG_CORREO_REQUERIDO
  if (mensaje.includes('shorter than or equal to')) return MSG_CORREO_LARGO
  if (mensaje.includes('must be an email')) return MSG_CORREO_INVALIDO
  return 'El servidor rechazó el correo. Revisa que esté bien escrito.'
}

/**
 * Traduce los mensajes de un 400 de `POST /citas` (`"paciente.correo must be
 * an email"`, …) a errores por campo, para marcar el campo culpable en vez de
 * mostrar solo un error genérico. Si ocurre, el front y el DTO se
 * desalinearon: la validación local debería haberlo atajado antes.
 *
 * Los mensajes que no nombran un campo conocido se ignoran (quedan en el
 * error general del formulario).
 */
export function erroresDelServidor(mensajes: string[]): NuevaCitaErrors {
  const errors: NuevaCitaErrors = {}
  for (const mensaje of mensajes) {
    const par = CAMPO_DEL_BACKEND.find(([prefijo]) => mensaje.startsWith(`${prefijo} `))
    if (!par) continue
    const [, campo] = par
    if (errors[campo]) continue
    errors[campo] =
      campo === 'correo' ? mensajeCorreo(mensaje) : 'El servidor rechazó este dato. Revísalo.'
  }
  return errors
}
