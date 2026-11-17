# DTF-09 · El texto de `/terminos` vive en dos repos y nada los compara solo

**Origen:** `pages/terminos/ui/TerminosPage.vue` (y los textos cortos de `features/crear-cita/ui/steps/MotivoStep.vue`,
`features/crear-cita/ui/ModalNuevaCita.vue` y `features/responder-cita/ui/TarjetaTerminos.vue`), frente a la copia
congelada del backend, `citia-backend/context/Cumplimiento/terminos-paciente-v1.0.md`, que se crea al publicar
**Severidad:** 🟡 baja · **Estado:** abierta (fichada el 2026-11-14, con [US-11](../us/11-terminos-paciente.md); en la
rama `feature/terminos-paciente`, sin release)

## Qué pasa

El texto que acepta el paciente está en dos lugares:

| Dónde | Qué es |
|-------|--------|
| `pages/terminos/ui/TerminosPage.vue` y los tres textos cortos | lo que **ve** el paciente |
| `citia-backend/context/Cumplimiento/terminos-paciente-v1.0.md` | la **prueba** de qué decía la versión 1.0. Se crea en el release y no se edita |

La base guarda solo el **número** de versión que aceptó cada paciente (`aceptaciones_terminos.version`), no el texto.
La versión sale de `shared/config/terminosPaciente.ts` (`VERSION_TERMINOS_PACIENTE`), espejo del catálogo del backend.

**No hay una comparación automática** entre los dos textos. El repo no tiene suite de tests (`package.json` solo tiene
`build` y `type-check`). La verificación de US-11 los comparó con un script local **no versionado**: 55 de 55 bloques
iguales con el texto del plan del backend ([Verificación](../us/11-terminos-paciente.md#verificación)).

## Por qué importa

Si alguien edita `TerminosPage.vue` (una palabra, una coma) **sin cambiar la versión**, nada falla al compilar ni en el
backend. Pero desde ese momento los pacientes que acepten la «1.0» habrán leído otro texto que el de la copia
congelada, y la prueba deja de decir qué aceptaron. Lo mismo con los textos cortos: la casilla, la tarjeta de `/cita`
y el texto del alta manual.

## Lo que lo hace tolerable hoy

- Hay **una sola versión** (1.0), y el texto no se ha editado desde la comparación.
- **La regla está escrita en los dos repos:** un cambio de texto es siempre una versión nueva. Está en el comentario
  de `shared/config/terminosPaciente.ts` y, en el backend, en ADR-16 §2 y en el `CLAUDE.md` del módulo `paciente`.
- La Definición de Terminado del plan del backend pide **comparar a mano**, párrafo por párrafo, antes del release.

## Cómo se cierra

Que la comparación deje de depender de alguien. Opciones, **sin decidir**:

- versionar el script de la verificación como un comando del repo (por ejemplo, `npm run verificar:terminos`) y
  correrlo antes de cada release que toque el texto;
- o que la página lea el texto de una sola fuente (un archivo de la versión) y la copia congelada se genere desde ahí.

## Cuándo revisar

Con la versión 1.1 del texto, o cuando el repo tenga una suite de tests.
