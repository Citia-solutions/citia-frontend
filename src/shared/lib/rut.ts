// Utilidades de RUT chileno.
//
// El backend valida lo mismo y es la autoridad final; esto existe para dar
// feedback inmediato en el formulario, sin ir al servidor para descubrir que
// el dígito verificador está mal. Ojo: el RUT viaja ya normalizado, así que el
// backend no ve lo que se escribió; la forma escrita solo se revisa aquí.

const FORMATO_CANONICO = /^\d{6,9}[0-9k]$/

// Forma escrita que acepta el formulario, antes de normalizar: el cuerpo sin
// puntos o con los puntos de miles bien puestos, GUION OBLIGATORIO y el
// verificador (dígito o K); se toleran espacios alrededor.
//
// Sin esta revisión, normalizar borraba lo que sobraba y '17.890.123-X' pasaba
// como el RUT 1.789.012-3: el RUT es la identidad del paciente, así que la
// solicitud o el alta quedaba a nombre de otra persona.
//
// Es la misma forma que exige el backend (`FORMATO_ESCRITO` en
// citia-backend/src/shared/domain/rut.ts) salvo el guion: allá es opcional
// porque recibe la forma canónica que envía este front. Aquí es obligatorio:
// sin guion, a un RUT al que le falta el verificador ('17890123') se lo lee
// como otro RUT, válido 1 de cada 11 veces. Si cambia allá, cambia aquí.
const FORMATO_ESCRITO = /^(?:\d{1,3}(?:\.\d{3})+|\d+)-[0-9kK]$/

/**
 * Lleva un RUT a su forma canónica: solo dígitos y verificador, sin puntos ni
 * guion, con la `k` en minúscula. Es la forma en que viaja al backend.
 *
 *   '12.345.678-K' -> '12345678k'
 *
 * Borra cualquier otro carácter sin preguntar: úsala solo con un RUT que ya
 * pasó `esRutValido`, nunca como validación.
 */
export function normalizarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toLowerCase()
}

/**
 * Si al RUT escrito le falta el guion antes del verificador. Solo para elegir
 * el mensaje de error: la regla completa es `esRutValido`.
 */
export function faltaGuionRut(rut: string): boolean {
  return !rut.includes('-')
}

/**
 * Valida la forma escrita (con guion) y el dígito verificador (módulo 11).
 *
 *   '12.345.678-5', '12345678-5' -> true
 *   '123456785' (sin guion), '17.890.123-X' -> false
 */
export function esRutValido(rut: string): boolean {
  if (!FORMATO_ESCRITO.test(rut.trim())) return false

  const limpio = normalizarRut(rut)
  if (!FORMATO_CANONICO.test(limpio)) return false

  const cuerpo = limpio.slice(0, -1)
  const digitoVerificador = limpio.slice(-1)

  // Serie de multiplicadores 2,3,4,5,6,7 repetida de derecha a izquierda.
  let suma = 0
  let multiplicador = 2
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = 11 - (suma % 11)
  const esperado = resto === 11 ? '0' : resto === 10 ? 'k' : String(resto)

  return digitoVerificador === esperado
}

/** Formatea para mostrar: '12345678k' -> '12.345.678-K'. Solo presentación. */
export function formatearRut(rut: string): string {
  const limpio = normalizarRut(rut)
  if (!FORMATO_CANONICO.test(limpio)) return rut

  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpo}-${limpio.slice(-1).toUpperCase()}`
}
