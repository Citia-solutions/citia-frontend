import type {
  ConfiguracionErrors,
  ConfiguracionField,
  ConfiguracionForm,
  ConfiguracionRecordatoriosDto,
  GuardarConfiguracionRequest,
} from './types'

/**
 * Reglas de la configuración, espejo de `GuardarConfiguracionRecordatoriosDto`
 * y de la entidad `ConfiguracionRecordatorio` del backend (ADR-13 §3). Copia a
 * mano, mismo patrón que DTF-06: el backend valida siempre; esto evita el 400
 * y explica la regla antes de guardar.
 */
export const LIMITES_CONFIGURACION = {
  /** `ANTELACION_MINIMA_MIN` */
  antelacionMinimaMin: 30,
  /** `ANTELACION_MAXIMA_MIN` (7 días) */
  antelacionMaximaMin: 10_080,
  /** `MAX_ANTELACIONES` */
  maxAntelaciones: 3,
  /** `LARGO_MAXIMO_TELEFONO_CONTACTO` */
  telefonoMax: 30,
  /** `LARGO_MAXIMO_CORREO_RESPUESTA` */
  correoMax: 254,
} as const

/**
 * Momentos que se ofrecen en la pantalla, de mayor a menor: 1 semana, 3 días,
 * 24 h, 2 h, 1 h y 30 min. Si la configuración guardada trae otro valor
 * válido (p. ej. 90), se agrega como opción para no perderlo.
 */
export const ANTELACIONES_SUGERIDAS: readonly number[] = [10_080, 4_320, 1_440, 120, 60, 30]

/** Horas sin envío (`RECORDATORIO_SILENCIO_DESDE` / `HASTA`, zona de la clínica). Solo informativas. */
export const HORAS_SIN_ENVIO = { desde: '21:00', hasta: '08:00' } as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** De mayor a menor y sin repetidos, como las devuelve el backend. */
export function ordenarAntelaciones(antelaciones: readonly number[]): number[] {
  return [...new Set(antelaciones)].sort((a, b) => b - a)
}

export function toForm(dto: ConfiguracionRecordatoriosDto): ConfiguracionForm {
  return {
    activo: dto.activo,
    antelacionesMin: ordenarAntelaciones(dto.antelacionesMin),
    telefonoContacto: dto.telefonoContacto ?? '',
    correoRespuesta: dto.correoRespuesta ?? '',
  }
}

/**
 * Formulario → cuerpo del PUT. Es un reemplazo completo: los textos vacíos
 * viajan como `null` ("sin teléfono", "sin Reply-To"), no se omiten.
 */
export function toGuardarRequest(form: ConfiguracionForm): GuardarConfiguracionRequest {
  const telefono = form.telefonoContacto.trim()
  const correo = form.correoRespuesta.trim()
  return {
    activo: form.activo,
    antelacionesMin: ordenarAntelaciones(form.antelacionesMin),
    telefonoContacto: telefono || null,
    correoRespuesta: correo || null,
  }
}

/** true si los dos formularios guardarían lo mismo. */
export function mismaConfiguracion(a: ConfiguracionForm, b: ConfiguracionForm): boolean {
  const ra = toGuardarRequest(a)
  const rb = toGuardarRequest(b)
  return (
    ra.activo === rb.activo &&
    ra.antelacionesMin.join(',') === rb.antelacionesMin.join(',') &&
    ra.telefonoContacto === rb.telefonoContacto &&
    // El backend guarda el correo en minúsculas.
    (ra.correoRespuesta ?? '').toLowerCase() === (rb.correoRespuesta ?? '').toLowerCase()
  )
}

export function validarConfiguracion(form: ConfiguracionForm): ConfiguracionErrors {
  const errors: ConfiguracionErrors = {}
  const { antelacionMinimaMin, antelacionMaximaMin, maxAntelaciones, telefonoMax, correoMax } =
    LIMITES_CONFIGURACION

  const antelaciones = ordenarAntelaciones(form.antelacionesMin)
  if (antelaciones.length === 0) {
    errors.antelacionesMin = 'Elige al menos un momento.'
  } else if (antelaciones.length > maxAntelaciones) {
    errors.antelacionesMin = `Puedes elegir hasta ${maxAntelaciones} momentos.`
  } else if (
    antelaciones.some((m) => !Number.isInteger(m) || m < antelacionMinimaMin || m > antelacionMaximaMin)
  ) {
    errors.antelacionesMin = 'Cada momento debe estar entre 30 minutos y 7 días antes de la cita.'
  }

  if (form.telefonoContacto.trim().length > telefonoMax) {
    errors.telefonoContacto = `El teléfono no puede superar los ${telefonoMax} caracteres.`
  }

  const correo = form.correoRespuesta.trim()
  if (correo) {
    if (correo.length > correoMax) {
      errors.correoRespuesta = `El correo no puede superar los ${correoMax} caracteres.`
    } else if (!EMAIL_RE.test(correo)) {
      errors.correoRespuesta = 'El correo no es válido. Revisa que esté bien escrito.'
    }
  }

  return errors
}

const MENSAJE_SERVIDOR: Record<Exclude<ConfiguracionField, 'activo'>, string> = {
  antelacionesMin: 'El servidor rechazó los momentos elegidos: de 1 a 3, entre 30 minutos y 7 días.',
  telefonoContacto: 'El servidor rechazó el teléfono de contacto.',
  correoRespuesta: 'El servidor rechazó el correo para respuestas. Revisa que esté bien escrito.',
}

/**
 * Errores por campo a partir de un 400. Sirve tanto para los mensajes del
 * `ValidationPipe` (`"correoRespuesta must be an email"`) como para los del
 * dominio, que nombran el campo y la regla.
 */
export function erroresDelServidor(mensajes: string[]): ConfiguracionErrors {
  const errors: ConfiguracionErrors = {}
  for (const mensaje of mensajes) {
    for (const campo of Object.keys(MENSAJE_SERVIDOR) as Array<keyof typeof MENSAJE_SERVIDOR>) {
      if (mensaje.includes(campo)) errors[campo] ??= MENSAJE_SERVIDOR[campo]
    }
  }
  return errors
}
