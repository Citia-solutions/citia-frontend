// Modelo del flujo público "Solicita una nueva cita".
//
// Es UI-only por ahora: el backend no expone un endpoint de pacientes, así que
// este formulario NO se envía todavía. El tipo es distinto de `NuevaCitaForm`
// porque el diseño separa Nombre y Apellidos en dos campos (el modal usa uno
// solo). Cuando exista el endpoint, `useAgendarCita` mapea esto al contrato.
import { esRutValido } from '@/shared/lib/rut'

/** Valores del formulario por secciones. */
export interface FlujoCitaForm {
  rut: string
  nombre: string
  apellidos: string
  correo: string
  telefono: string
  fecha: string // 'YYYY-MM-DD'
  hora: string // 'HH:mm'
  motivo: string
  consentimiento: boolean
}

export type FlujoCitaField = keyof FlujoCitaForm
export type FlujoCitaErrors = Partial<Record<FlujoCitaField, string>>

/** Identificador de cada sección del flujo, en orden. */
export type FlujoCitaPaso = 'identificacion' | 'contacto' | 'horario' | 'motivo'

export const PASOS: ReadonlyArray<{
  id: FlujoCitaPaso
  titulo: string
  subtitulo: string
  kicker?: string
}> = [
  {
    id: 'identificacion',
    titulo: 'Identifícate',
    subtitulo: 'Cuéntanos quién eres para agendar tu atención.',
    kicker: 'Agenda tu cita',
  },
  {
    id: 'contacto',
    titulo: 'Contacto',
    subtitulo: 'Déjanos tus datos para confirmar y avisarte sobre tu cita.',
  },
  {
    id: 'horario',
    titulo: 'Horario',
    subtitulo: 'Elige el día y la hora que más te acomoden.',
  },
  {
    id: 'motivo',
    titulo: 'Motivo',
    subtitulo: 'Cuéntanos brevemente el motivo de tu consulta.',
  },
]

export const FORM_VACIO: FlujoCitaForm = {
  rut: '',
  nombre: '',
  apellidos: '',
  correo: '',
  telefono: '',
  fecha: '',
  hora: '',
  motivo: '',
  consentimiento: false,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9 ()-]+$/

/**
 * Mensaje de error del RUT, o `undefined` si está correcto. Vive aquí para que
 * la validación del paso y el aviso "en vivo" del input compartan la misma
 * regla y el mismo texto (UI-first: el backend valida igual con módulo 11).
 */
export function errorRut(rut: string): string | undefined {
  if (!rut.trim()) return 'Ingresa tu RUT.'
  if (!esRutValido(rut)) return 'El RUT ingresado no es válido.'
  return undefined
}

/**
 * Valida solo los campos del paso indicado. Cada sección valida sus propios
 * campos para no bloquear el avance con errores de secciones futuras.
 */
export function validarPaso(values: FlujoCitaForm, paso: FlujoCitaPaso): FlujoCitaErrors {
  const errors: FlujoCitaErrors = {}

  switch (paso) {
    case 'identificacion':
      const msgRut = errorRut(values.rut)
      if (msgRut) errors.rut = msgRut
      if (!values.nombre.trim()) {
        errors.nombre = 'Ingresa tu nombre.'
      }
      if (!values.apellidos.trim()) {
        errors.apellidos = 'Ingresa tus apellidos.'
      }
      break

    case 'contacto':
      if (!values.telefono.trim()) {
        errors.telefono = 'Ingresa tu teléfono.'
      } else if (!PHONE_RE.test(values.telefono.trim())) {
        errors.telefono = 'El teléfono no es válido.'
      }
      if (!values.correo.trim()) {
        errors.correo = 'Ingresa tu correo.'
      } else if (!EMAIL_RE.test(values.correo.trim())) {
        errors.correo = 'El correo no es válido.'
      }
      break

    case 'horario':
      if (!values.fecha) {
        errors.fecha = 'Selecciona el día.'
      }
      if (!values.hora) {
        errors.hora = 'Selecciona una hora.'
      }
      break

    case 'motivo':
      if (!values.motivo.trim()) {
        errors.motivo = 'Cuéntanos el motivo de tu consulta.'
      }
      if (!values.consentimiento) {
        errors.consentimiento = 'Se necesita tu autorización para contactarte.'
      }
      break
  }

  return errors
}
