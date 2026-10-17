/**
 * Caracteres que puede tener el token: base64url (el backend lo deriva con
 * HMAC-SHA256 → 43 caracteres). El largo exacto NO se valida aquí (es regla del
 * backend, que responde 404 a cualquier formato inválido); el tope de 256 solo
 * evita mandar una cabecera absurda.
 */
const FORMATO_TOKEN = /^[A-Za-z0-9_-]{1,256}$/

/**
 * Token del enlace a partir del fragmento de la URL (`/cita#<token>`), o null si
 * no hay o no tiene forma de token.
 *
 * El token va en el fragmento porque el navegador nunca lo manda al servidor
 * que sirve el front (ni a sus logs) ni lo pone en el `Referer`. Un fragmento
 * con caracteres fuera de base64url se trata como "sin token": además de no
 * poder ser válido, `fetch` rechaza una cabecera con caracteres no ASCII y el
 * paciente vería un error de conexión en vez de "enlace no válido".
 */
export function tokenDesdeFragmento(fragmento: string): string | null {
  const token = (fragmento.startsWith('#') ? fragmento.slice(1) : fragmento).trim()
  return FORMATO_TOKEN.test(token) ? token : null
}
