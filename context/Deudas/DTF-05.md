# DTF-05 · El algoritmo del RUT está duplicado en los dos repos

**Origen:** `src/shared/lib/rut.ts` y `citia-backend/src/shared/domain/rut.ts`
**Severidad:** 🟡 baja · **Estado:** 🔵 **aceptada a conciencia**

## Qué pasa

El módulo 11 y la normalización del RUT existen dos veces: una en el backend, que es la autoridad,
y otra en el frontend, para validar mientras el usuario escribe.

## Por qué se aceptó

La alternativa —consultar al servidor para saber si el dígito verificador está bien— convierte una
validación instantánea en un viaje de red por cada tecleo. Y un paquete compartido entre los dos
repos es infraestructura que hoy no existe y que no se justifica por 40 líneas.

**La regla que lo hace seguro: el backend valida siempre, sin excepción.** El del frontend es
comodidad; si divergieran, el servidor rechaza y no se corrompe nada.

## Cuándo revisar

Si aparece una tercera cosa que necesite las mismas utilidades de dominio (una app móvil, un worker,
el formulario público del paciente), entonces sí conviene un paquete compartido. Con dos, no.
