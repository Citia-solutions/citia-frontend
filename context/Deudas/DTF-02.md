# DTF-02 · `fetchCurrentUser()` apunta a un endpoint que no existe

**Origen:** `src/entities/session/api/sessionApi.ts` (borrado)
**Severidad:** 🟡 baja · **Estado:** cerrada (2026-10-05, limpieza previa al release, `feature/frontend-prerelease`)

> **Cierre: se quitó.** `fetchCurrentUser()` y `entities/session/api/` ya no existen. La sesión se
> rehidrata **sin `GET /me`**: al iniciar sesión el `AuthUser` se guarda junto al token y en el mismo
> almacenamiento (`citia.user`, `entities/session/model/storedUser.ts`), y `restoreSession()` lo
> vuelve a leer al recargar — ver [login-sesion](../Features/login-sesion.md).
>
> **Lo que queda sin `/me`, aceptado:** los datos guardados (nombre, rol, clínica) son los del
> momento del login. Si cambian en el servidor, el front los ve recién al volver a iniciar sesión
> (como mucho, al vencer el token: 1 día). Si algún día hace falta refrescarlos, se pide `GET /me`
> al backend y `restoreSession` lo usa; no hay nada que deshacer en el front.
>
> Lo de abajo es el registro original.

## Qué pasa

```ts
export function fetchCurrentUser(): Promise<AuthUser> {
  return http.get<AuthUser>('/me')
}
```

**El backend no expone `GET /me`.** Sus rutas son `/auth/login`, `/usuarios`, `/pacientes` y
`/citas`. La función está exportada en la API pública del slice `session` y hoy **nadie la usa**.

## Por qué importa

Es una trampa, no un bug: está disponible, parece lista, y quien la llame se va a encontrar un 404
sin ninguna pista de que el endpoint nunca existió. El caso natural es rehidratar la sesión al
recargar la página, que es exactamente cuando alguien la va a buscar.

## Cómo se cierra

Dos caminos, y la elección no corresponde a este documento:

- **Quitarla** hasta que el endpoint exista, para que no engañe.
- **Pedir el endpoint al backend**, que es lo que hace falta para rehidratar la sesión al recargar
  (hoy el usuario se pierde en cuanto se refresca, aunque el token siga guardado).

El segundo camino es una funcionalidad, no una corrección: pertenece a la historia que aborde la
persistencia de sesión.
