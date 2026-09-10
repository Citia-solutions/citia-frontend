# DTF-02 · `fetchCurrentUser()` apunta a un endpoint que no existe

**Origen:** `src/entities/session/api/sessionApi.ts`
**Severidad:** 🟡 baja hoy (nadie la llama) · **Estado:** abierta

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
