# US-11 · Términos de uso y aviso de privacidad del paciente (frontend)

> Cumplimiento transversal (Ley 21.719), RNF-02. El paciente lee qué hace Citia con sus datos, lo acepta y queda la
> prueba de qué versión aceptó y por dónde.

**Estado:** 🔶 **Implementada en la rama** (2026-11-14, `feature/terminos-paciente`, sale de `origin/develop` =
`c813d56`; commits `eb3fbcc` página, `dc01428` casillas, `9614634` tarjeta de `/cita`, `644a601` bandeja) ·
`npm run build` en verde · el texto de `/terminos` comparado bloque por bloque con el del plan (ver
[Verificación](#verificación)) · **falta** la revisión en el navegador, staging y el release.
**Lado:** paciente (`/terminos`, formulario público, `/cita`) y panel (modal *Nueva cita*, bandeja)
**Backend (contrato):** plan [`11-terminos-paciente.md`](../../../citia-backend/context/US/11-terminos-paciente.md)
(`citia-backend/context/US/11-terminos-paciente.md`), secciones *El texto que se publica*, *Frontend* y *Aplicación y
API* · [ADR-16](../../../citia-backend/context/Decisions/ADR-16.md) (el porqué)
**Página nueva:** `pages/terminos` · **Features que cambian:** [agendar-cita-paciente](../Features/agendar-cita-paciente.md),
[crear-cita](../Features/crear-cita.md), [responder-cita-paciente](../Features/responder-cita-paciente.md),
[bandeja-solicitudes](../Features/bandeja-solicitudes.md)

---

## Descripción

> Como **paciente** quiero leer qué hace Citia con mis datos antes de pedir hora, y que quede registrado que acepté y
> qué versión acepté.
>
> Como **paciente agendado por mi profesional** quiero aceptar los términos yo mismo desde la página de mi hora, sin
> que eso me impida confirmarla o cancelarla.
>
> Como **profesional** quiero tener un texto concreto que leerle o enviarle al paciente antes de registrarlo a mano.

### Criterios de aceptación (lado del front)

- [x] `/terminos` muestra el texto completo de la 1.0, con *Versión 1.0 · publicada el 14 de noviembre de 2026*.
      Pública: sin sesión, sin el layout del panel, sin API y sin recursos de terceros.
- [x] La casilla del formulario público enlaza a `/terminos` en otra pestaña con el texto corto del plan. Sin
      marcarla no se envía (*«Para enviar la solicitud tienes que aceptar los términos.»*).
- [x] El modal *Nueva cita* muestra el texto del alta manual con la dirección de `/terminos` de este sitio antes de la
      casilla nueva. Sin marcarla: *«Marca la casilla cuando el paciente te haya autorizado.»*
- [x] En `/cita`, con `terminosPendientes === true`, la tarjeta *Tus datos y Citia* aparece **sobre** las acciones,
      que siguen funcionando. «Acepto» la quita y muestra *«Gracias. Quedó registrada tu autorización.»*
- [x] La bandeja muestra *«· aceptó los términos v1.0»* en las solicitudes que la traen.
- [x] Funciona con el backend de hoy (se despliega **primero**, ADR-16 §10): `terminosVersion` viaja igual y el
      backend viejo la descarta; sin `terminosPendientes` no hay tarjeta; sin `terminosVersion` en la bandeja no hay
      línea.

---

## Contrato que consume

| Llamada | Cambio |
|---------|--------|
| `POST /publico/:tenantSlug/solicitudes` | suma `terminosVersion: '1.0'`; `consentimiento` debe ser `true` |
| `POST /citas` (con `paciente`) | suma `paciente.terminosVersion: '1.0'`; `paciente.consentimiento` debe ser `true` |
| `GET /publico/cita` y los `POST` de `/publico/cita/*` | la vista suma `terminosPendientes: boolean` (opcional en el tipo) |
| `POST /publico/cita/aceptar-terminos` (nueva) | `{ terminosVersion }` → 200 con la vista; 400, 404, 429. Mismas opciones que las demás (`auth: false`, `X-Enlace-Cita`, `no-store`, `no-referrer`) |
| `GET /solicitudes` | `SolicitudBandejaDto` suma `terminosVersion: string \| null` (ausente → `null`) |

**El 400 de la versión** trae el mensaje fijo *«La versión de los términos ya no está vigente. Recarga la página.»*
(`MENSAJE_VERSION_TERMINOS_NO_VIGENTE`, espejo exacto del backend), como texto o dentro de una lista; en
`paciente.terminosVersion` el `ValidationPipe` le antepone `paciente.`. `esVersionTerminosNoVigente(e)` lo busca
**contenido** en `message` y cada pantalla dice qué hacer:

| Dónde | Texto |
|-------|-------|
| Formulario público | *«Los términos se actualizaron. Recarga la página para ver la versión vigente.»* |
| Modal *Nueva cita* | *«Los términos se actualizaron. Recarga la página.»* |
| `/cita` («Acepto») | *«Los términos se actualizaron. Abre de nuevo el enlace de tu correo.»* (recargar `/cita` no sirve: el token ya no está en la URL) |

---

## Qué cambió en este repo

| Pieza | Cambio |
|-------|--------|
| `shared/config/terminosPaciente.ts` (nuevo) | `VERSION_TERMINOS_PACIENTE = '1.0'`, `FECHA_TERMINOS_PACIENTE = '2026-11-14'` (**se actualiza al día del release a production**), `RUTA_TERMINOS`, `MENSAJE_VERSION_TERMINOS_NO_VIGENTE` y `esVersionTerminosNoVigente`. Si cambia el backend, cambia esto en el mismo cambio |
| `shared/ui/BaseCheckbox.vue` | slot por defecto para la etiqueta (la prop `label` sigue igual); la casilla se alinea con la primera línea. Un clic en un enlace de la etiqueta no marca la casilla (comportamiento del `<label>` del navegador) |
| `pages/terminos` (nuevo) + `app/router` | ruta pública `/terminos` (`name: 'terminos'`) con el texto de la 1.0 |
| `features/crear-cita` | casilla del formulario con el enlace (otra pestaña) y su mensaje; `terminosVersion` en los dos cuerpos; texto del alta manual, casilla y ayuda del modal; el 400 de la versión |
| `features/responder-cita` | `TarjetaTerminos.vue` (nuevo) en `ResumenHora`; `aceptarTerminos` en la API y en `useRespuestaCita` (por `ejecutar`, un envío a la vez); `EnvioPaciente`, `AceptarTerminosRequest`, `terminosPendientes?`; el 400 de la versión en `mensajeDeError` |
| `entities/solicitud` + `features/bandeja-solicitudes` | `terminosVersion` en el DTO y en `Solicitud`; la línea de la bandeja reemplaza *«· acepta recordatorios»* |

`public/_headers` no cambia: `/cita` ya va con `no-referrer` y `/terminos` no lleva datos (puede indexarse).

### Decisiones de la implementación (dentro del plan)

- **La tarjeta solo con la hora vigente**, además de `terminosPendientes === true`: tras cancelar, la vista puede
  traer todavía `true`, pero el enlace ya no sirve y «Acepto» daría el 404 de "enlace no válido". Mismo criterio que
  el bloque de *Pediste otra hora*.
- **Un envío a la vez:** mientras se envía «Acepto» los botones de la hora se deshabilitan, y al revés (el `ejecutar`
  de siempre). No dependen de aceptar: sin enviar nada, todos están habilitados.
- **El error de «Acepto» va en la tarjeta**, no junto a los botones de la hora (`errorDe`).
- **«Iguales»** (profesional y organización con el mismo nombre) se compara sin mayúsculas ni espacios de más.
- Tras «Acepto», el foco vuelve al título de la hora (el botón que lo tenía desaparece).
- **Sin el botón *«Copiar texto»*** del alta manual (opcional en el plan): `copiarAlPortapapeles` vive en
  `features/compartir-enlace-agenda` y habría que bajarlo a `shared/lib`.

---

## Verificación

- `npm run build` (incluye `vue-tsc`) en verde.
- **Texto idéntico al del plan:** un script local (no versionado: el repo no tiene suite) renderizó en el servidor
  (`vue/server-renderer`, con la configuración de Vite del repo) `TerminosPage`, la casilla de `MotivoStep`,
  `TarjetaTerminos` (con nombres distintos y con el mismo nombre) y el bloque del alta manual de `ModalNuevaCita`, y
  los comparó **bloque por bloque** (cada título, párrafo y viñeta) con *El texto que se publica* del plan, quitando
  solo el marcado de Markdown y normalizando espacios: **55 de 55 bloques iguales** (42 de `/terminos`, incluida la
  línea del job G1 en el §2). La primera pasada encontró una coma faltante en la tarjeta (*«{profesional}, de
  {organizacion}, usa…»*), ya corregida.
- **Sin probar en el navegador** (la revisión visual es del usuario): ver [Pendientes](#pendientes).

## Pendientes

| Qué | Nota |
|-----|------|
| Revisión en el navegador | `/terminos` (375 px y escritorio); la casilla del formulario (el enlace abre otra pestaña, no marca la casilla y lo escrito sigue); el modal *Nueva cita*; la tarjeta de `/cita` con `terminosPendientes: true` simulado (acciones habilitadas, «Acepto» la quita, 400 del mensaje fijo, 429) y sin el campo (no aparece); la bandeja con y sin `terminosVersion` |
| `FECHA_TERMINOS_PACIENTE` | Hoy 2026-11-14: se cambia al día del release a production, en el mismo PR (plan § El texto que se publica) |
| Release | Frontend **primero**; el backend al menos 30 minutos después (ADR-16 §10) |
| *«Copiar texto»* en el alta manual | Opcional; ver arriba |
