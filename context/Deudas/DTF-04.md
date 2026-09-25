# DTF-04 · El modelo de sesión contempla un rol que el backend no emite

**Origen:** `src/entities/session/model/types.ts`
**Severidad:** 🟡 baja · **Estado:** abierta

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
