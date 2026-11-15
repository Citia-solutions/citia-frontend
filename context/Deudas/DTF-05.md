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

> **Matiz (2026-11-14, corrección del RUT mal escrito).** La regla de arriba vale para el módulo 11, pero
> **no para la forma escrita**: el front envía el RUT ya normalizado (`normalizarRut`), y normalizar borra
> todo lo que no es dígito o `k`. Los dos lados validaban "normalizar y después módulo 11", así que
> `17.890.123-X` llegaba al backend como `17890123` y pasaba como el RUT 1.789.012-3: la solicitud o el
> alta quedaba **a nombre de otra persona**, y el servidor no podía verlo. Desde la rama
> `fix/rut-formato-estricto` (en los dos repos):
>
> - los dos revisan la **forma escrita antes de normalizar**, con la misma expresión regular: cuerpo sin
>   puntos o con los puntos de miles bien puestos y el verificador (dígito o K);
> - **el guion es la única diferencia**: el front lo exige (sin guion, a un RUT al que le falta el
>   verificador, como `17890123`, se lo lee como otro RUT, válido 1 de cada 11 veces) y el backend no,
>   porque recibe la forma canónica que envía el front y la que reusa la bandeja;
> - como el backend no ve lo escrito, **la forma escrita solo la revisa el front**: si se cambia aquí, se
>   cambia allá en el mismo cambio, y al revés (`FORMATO_ESCRITO` en los dos `rut.ts`).
>
> Queda una opción no hecha: enviar el RUT tal como se escribió (con `trim`) en vez de normalizado, para
> que el backend vuelva a ser la autoridad también de la forma. El backend ya acepta las dos formas.

## Cuándo revisar

Si aparece una tercera cosa que necesite las mismas utilidades de dominio (una app móvil, un worker,
el formulario público del paciente), entonces sí conviene un paquete compartido. Con dos, no.
