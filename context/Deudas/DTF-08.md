# DTF-08 · Los errores del backend se reconocen por su texto

**Origen:** `erroresDelServidor` de `features/editar-perfil/model/perfilSchema.ts`,
`features/cambiar-contrasena/model/contrasenaSchema.ts`, `features/contactar-soporte/model/soporteSchema.ts`,
`features/crear-cita/model/crearCitaSchema.ts` y `features/configurar-recordatorios/model/configuracionSchema.ts`;
`features/gestionar-cita/model/mensajeDeError.ts` y `useEditarContacto.ts`
**Severidad:** 🟡 baja · **Estado:** abierta (fichada el 2026-11-01, riesgo 1 del
[plan de US-10](../us/10-perfil-cuenta.md#riesgos))

## Qué pasa

Los errores del backend no traen un código propio: el cuerpo es el de NestJS (`statusCode`, `message` y `error`,
el nombre del status), y los controladores pasan el texto del error de dominio a la excepción HTTP (p. ej.
`new BadRequestException(error.message)` en `PerfilController`). Para mostrar un error **junto al
campo** que lo causó, o para distinguir un 409 de otro, el front lee el texto:

| Forma | Ejemplo | Cómo se reconoce |
|-------|---------|------------------|
| 400 del `ValidationPipe` (`message: string[]`, inglés) | `nombreCompleto must be shorter than or equal to 120 characters` | el nombre del campo al **comienzo** (`startsWith('nombreCompleto ')`) y, a veces, una palabra (`includes('shorter')`) para elegir el texto en español |
| 400 de dominio (`message: string`, español) | *"La contraseña actual no es correcta"*, *"Mensaje a soporte inválido (categoria): …"* | el **comienzo** del texto (`startsWith('La contraseña actual')`) |
| 409 de dominio | *"La cita todavía no comienza: …"* (US-07.01) | el comienzo del texto, para mostrarlo tal cual en vez del 409 genérico |

Las listas en inglés se leen con `mensajesDeValidacion` y los textos con `mensajeDelBackend`
(`shared/api/erroresValidacion.ts`). Cada feature tiene su propio `erroresDelServidor`.

## Por qué importa

Si el backend cambia un texto (una palabra, el nombre de un campo del DTO, la versión de class-validator), nada
falla al compilar ni en el backend: el front deja de reconocerlo y el error cae en el **mensaje general** del
formulario en vez de junto al campo, o un 409 específico se muestra como el genérico. No se pierde información
—lo no reconocido se muestra igual—, pero la pantalla orienta peor.

## Lo que lo hace tolerable hoy

- **Se valida antes de enviar** (F6 de US-10, y lo mismo en los features anteriores): un 400 del
  `ValidationPipe` solo llega si el front y el DTO se desalinearon (ver [DTF-06](DTF-06.md)).
- Se compara el **comienzo** del texto, no el texto entero.
- Lo que no se reconoce va al mensaje general, nunca se descarta.

## Cómo se cierra

Que el backend agregue un **código estable** al cuerpo de error (p. ej. `codigo: 'CONTRASENA_ACTUAL_INCORRECTA'`,
o el campo en los de validación) y el front lea ese código en vez del texto. Es un cambio de contrato del backend
para todos sus errores de dominio, no solo los de US-10: no corresponde decidirlo aquí.

## Cuándo revisar

Si un error deja de aparecer junto a su campo tras un cambio del backend, o cuando el backend toque el formato
de sus errores (filtro de excepciones o `ValidationPipe`).
