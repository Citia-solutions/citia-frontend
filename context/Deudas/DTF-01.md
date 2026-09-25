# DTF-01 · `isAuthenticated` acepta una sesión a medias

**Origen:** `src/entities/session/model/store.ts`
**Severidad:** 🟠 media · **Estado:** abierta · **Barata de cerrar**

## Qué pasa

```ts
const isAuthenticated = computed(() => currentUser.value !== null)
```

La comparación es contra `null`. Si algo asigna `undefined` —por ejemplo
`setSession(user, token)` con valores que no llegaron—, la expresión da **`true`** y el guard de
ruta deja pasar a alguien que no tiene sesión.

## Por qué importa

Ya ocurrió. Cuando `authApi.login()` devolvía una forma que no calzaba con la del backend,
`useLogin` destructuraba `{ user, token }` y ambos quedaban `undefined`. Resultado:
`isAuthenticated` daba `true`, el guard permitía entrar al dashboard, y el fallo **se manifestaba
tres pantallas después** como un 401 al guardar una cita — donde no estaba la causa.

El bug de origen ya está corregido, pero la comparación sigue permitiendo que un fallo de este tipo
se disfrace de sesión válida en vez de explotar donde nace.

## Cómo se cierra

Cambiar la comparación para que solo un usuario real cuente como sesión (`!= null`, o una
comprobación de verdad sobre el objeto). Una línea.

Vale la pena considerar además que la sesión exija token: hoy `currentUser` y el token viven en
lugares distintos —el store y `shared/lib/authToken`— y nada verifica que existan los dos.
