// Utilidades de RUT chileno.
//
// El backend valida lo mismo y es la autoridad final; esto existe para dar
// feedback inmediato en el formulario, sin ir al servidor para descubrir que
// el dígito verificador está mal.

const FORMATO_CANONICO = /^\d{6,9}[0-9k]$/

/**
 * Lleva un RUT a su forma canónica: solo dígitos y verificador, sin puntos ni
 * guion, con la `k` en minúscula. Es la forma en que viaja al backend.
 *
 *   '12.345.678-K' -> '12345678k'
 */
export function normalizarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toLowerCase()
}

/** Valida el dígito verificador con el algoritmo módulo 11. */
export function esRutValido(rut: string): boolean {
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
