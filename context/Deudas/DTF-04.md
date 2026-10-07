# DTF-04 · El modelo de sesión contempla un rol que el backend no emite

**Origen:** `src/entities/session/model/types.ts`
**Severidad:** 🟡 baja · **Estado:** cerrada (2026-10-05, limpieza previa al release, `feature/frontend-prerelease`)

> **Cierre: se quitó `'recepcion'` del tipo.** Ahora `UserRole = 'admin' | 'profesional'`, los dos
> que emite el backend. El cierre se adelantó porque apareció justo la vista que la deuda anunciaba:
> el sidebar muestra el rol en español (`ROLE_LABELS` en `entities/session/model/role.ts`).
>
> La traducción de roles sigue siendo una decisión visible: `authApi.ts` mapea `ADMINISTRADOR` y
> `PROFESIONAL`, y un rol desconocido cae al menos privilegiado (`profesional`). Un `citia.user`
> guardado con un rol que no está en `ROLE_LABELS` se descarta al restaurar la sesión.
>
> **Para agregar un rol** (cuando el backend lo emita; encadenado a `DT-07` y `DT-02`): `types.ts`,
> `ROLE_LABELS` y el mapa de `authApi.ts`. Lo de abajo es el registro original.

## Qué pasa

```ts
role: 'admin' | 'profesional' | 'recepcion'
```

El backend solo emite dos roles: `ADMINISTRADOR` y `PROFESIONAL`. `'recepcion'` no existe en
ninguna parte del servidor, así que es una rama del tipo a la que nunca se llega.

## Por qué importa

Poco hoy. Importa el día que aparezca una vista que ramifique por rol: `'recepcion'` va a parecer
un caso soportado y no lo está. Y la traducción de roles (`authApi.ts`) tiene que decidir qué hacer
con lo desconocido — hoy asume el menos privilegiado, que es lo correcto, pero conviene que sea una
decisión visible y no un descarte silencioso.

## Cómo se cierra

O se quita del tipo hasta que exista, o se pide el rol al backend. Está encadenado a dos deudas del
servidor: que no existe alta de un segundo usuario, y que el rol se emite y nadie lo verifica
(`citia-backend/context/Deudas/DT-07.md` y `DT-02.md`).
