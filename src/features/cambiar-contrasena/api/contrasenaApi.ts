import { http } from '@/shared/api/httpClient'
import type { CambiarContrasenaRequest, ContrasenaCambiada } from '../model/types'

/**
 * PUT /usuarios/me/contrasena — cambia la contraseña del usuario del token y
 * devuelve el token nuevo de esta sesión.
 *
 * Va **con** el Bearer (sin `{ auth: false }`): la ruta exige sesión. Una
 * contraseña actual mal escrita es un **400**, nunca un 401, así que no cierra
 * la sesión. 409 si la contraseña cambió en paralelo; 429 por el límite de
 * tasa (5 por hora por IP).
 */
export function cambiarContrasena(payload: CambiarContrasenaRequest): Promise<ContrasenaCambiada> {
  return http.put<ContrasenaCambiada>('/usuarios/me/contrasena', payload)
}
