# Bandeja de solicitudes y enlace de agenda

**Estado:** ✅ Implementado (2026-09-25) · ⚠️ verificado solo con respuestas simuladas: el backend del
cierre de Fase 1 se implementa en paralelo
**Rama:** `feature/us02-cierre-fase1` (sin commit)
**Origen:** cierre de Fase 1 de US-02 — decisión 4 del contrato (*bandeja: listar, aceptar, rechazar*)
y §d (*enlace para compartir la URL pública*)
**Backend:** [`us02-gestion-citas.md` § Cierre de Fase 1 (c) y (d)](../../../citia-backend/context/Features/us02-gestion-citas.md#cierre-de-fase-1--contrato-2026-09-25) ·
[ADR-09](../../../citia-backend/context/Decisions/ADR-09.md) §3, §10, §11
**Features:** `src/features/bandeja-solicitudes/`, `src/features/compartir-enlace-agenda/` ·
**Entidad:** `src/entities/solicitud/` · **Ruta:** `/solicitudes`
**Fase 3 (2026-10-14):** solicitudes de otra hora (`tipo: 'reagendamiento'`) y estado `descartada` —
ver [Cambios de la Fase 3](#cambios-de-la-fase-3--solicitudes-de-otra-hora-2026-10-14).

---

## Qué hace

Cierra el circuito del [flujo público](agendar-cita-paciente.md): lo que el paciente pide en
`/agendar-cita/:tenantSlug` llega aquí, y el profesional lo **acepta** (se crea la cita) o lo
**rechaza**.

- **Pestañas** Recibidas (por defecto) · Aceptadas · Rechazadas (`GET /solicitudes?estado=`).
- **Cada solicitud:** nombre, RUT, motivo, preferencia horaria, teléfono y correo (enlaces `tel:` /
  `mailto:`), si acepta recordatorios, y cuándo se recibió (y se resolvió, en las otras pestañas).
- **Píldora en el sidebar** con las recibidas por responder.
- **"Copiar enlace de agenda"** arriba de la bandeja, con la advertencia de DT-18.

---

## Contrato con el backend

| Llamada | Uso |
|---------|-----|
| `GET /solicitudes?estado=recibida\|aceptada\|rechazada` → `SolicitudBandejaDto[]` (máx. 100, sin paginación) | lista de la pestaña y conteo del sidebar |
| `POST /solicitudes/:id/aceptar` — `{ inicio, duracionMin, tipoConsulta }` → 201 `{ solicitud, cita }` | aceptar |
| `POST /solicitudes/:id/rechazar` — sin cuerpo → 200 `SolicitudBandejaDto` | rechazar |

- `toSolicitud()` (`entities/solicitud/api/solicitudApi.ts`) es el único lugar que conoce el DTO.
  El slice nombra en español (mismo vocabulario del backend y del flujo público).
- `resueltaEn` y `citaId` se toleran ausentes (`null`).
- El orden lo da el backend (recibidas: la que más espera primero; resueltas: la más reciente
  primero). El front no reordena.
- La bandeja es **de la organización**: cualquier profesional del tenant la ve y la resuelve.

---

## Aceptar

Modal (mismo patrón y estilo que "Nueva cita") que pide:

| Campo | Regla en el front | Espejo de |
|-------|-------------------|-----------|
| Fecha + hora | Obligatorias, **futuras** (el backend aceptaría el pasado, DT-13). Bloques de `BLOQUES_HORARIOS` (07:00–21:00 desde el 2026-10-05). Con la duración elegida, la cita debe terminar a más tardar a las **22:00** (`FIN_DE_JORNADA`). | — |
| `inicio` | `aInicioISO()` → instante con zona explícita, igual que crear y reagendar. | `@Matches(/(Z\|[+-]hh:mm)$/)` |
| `duracionMin` | Entero **1..1440**, por defecto 30. | `@IsInt @IsPositive @Max(1440)` — `DURACION_MAXIMA_MIN`, copia a mano ([DTF-06](../Deudas/DTF-06.md)) |
| `tipoConsulta` | Obligatorio, **precargado con el `motivo`** (ADR-09 §10). | `@IsNotEmpty` |

- **Precarga de fecha y hora desde la preferencia** (`sugerirInicio`): la preferencia es texto que
  armó el propio front (`aPreferenciaHoraria`: *"viernes, 18 de septiembre a las 10:00"*), así que
  se intenta leer. Año = el de `recibidaEn` (o el siguiente si ese día ya había pasado). **Solo se
  precarga si la hora sigue siendo futura**; si no calza, los campos quedan vacíos. La preferencia se
  muestra siempre como referencia, con *"no reserva nada"*.
- **Éxito:** se cierra el modal, se recarga la bandeja y se muestra *"Solicitud de X aceptada: cita
  agendada para el … a las …, pendiente de confirmación"* con **"Ver en la agenda"** y, si la cita
  choca con otras, el **aviso de solapamiento** ([ADR-11](agenda-profesional.md#aviso-de-solapamiento-adr-11)).
- **400 / 401 / red:** el error queda en el modal, con lo escrito, para reintentar.

## Rechazar

Confirmación simple (foco inicial en "Volver"), **sin motivo** (DT-26: no retener más dato sensible).
Copy: *"No se creará ninguna cita … El paciente no recibe ningún aviso desde citiahealth: si corresponde,
contáctalo tú."* (no hay canal, RF-06).

## 404 y 409

Tanto al aceptar como al rechazar: se cierra el diálogo, se recarga la lista y se muestra:

| Status | Texto |
|--------|-------|
| 404 | *"Esta solicitud ya no está disponible."* (no distingue "no existe" de "otra organización") |
| 409 | *"Esta solicitud ya fue resuelta, quizás por otra persona de tu equipo. Actualizamos la bandeja."* |

Aceptar dos veces es 409 y **no** devuelve la cita anterior: el front no intenta recuperarla.

## Mantenerse al día

Refrescar = volver a pedir la pestaña (tras cada acción, al volver a la pestaña con mínimo de 30 s).
La píldora del sidebar (`useSolicitudesRecibidas`) se cuenta al montar el panel y al volver el foco;
cuando la bandeja carga "Recibidas", informa su largo y se evita la segunda petición. Con 100
(el tope) muestra **"100+"**. Un fallo al contar no se muestra: la píldora simplemente no aparece.

---

## Enlace de agenda (§d)

- El login ahora devuelve `usuario.tenantSlug`; `authApi` lo guarda en `AuthUser.tenantSlug`
  (**opcional**).
- URL = `window.location.origin` + `router.resolve({ name: 'agendarCita', params: { tenantSlug } })`
  → `/agendar-cita/:tenantSlug` (se arma con el router, no a mano).
- **Sin `tenantSlug` en la sesión** (login contra un backend anterior): el bloque no se muestra.
- Copia con `navigator.clipboard`; si el navegador no lo permite, muestra el enlace seleccionado para
  copiarlo a mano.
- **Advertencia DT-18** visible mientras `ENLACE_PUBLICO_LISTO = false`
  (`features/compartir-enlace-agenda/model/enlaceAgenda.ts`): *"Todavía no lo publiques en redes ni
  lo difundas masivamente. La página de solicitudes aún no limita cuántos envíos acepta"*. Cuando el
  backend cierre DT-18, basta cambiar la constante.

---

## Cambios de la Fase 3 — solicitudes de otra hora (2026-10-14)

Rama `feature/fase3-respuesta-paciente`. Detalle en
[responder-cita-paciente](responder-cita-paciente.md#bandeja-featuresbandeja-solicitudes).

- **Dos tipos de solicitud.** `nueva` (el enlace de agenda, como hasta ahora) y `reagendamiento`: un
  paciente con hora pide otra desde el enlace de su recordatorio (`/cita`). `SolicitudBandejaDto` suma
  `tipo`, `citaOrigenId` y `citaOrigen: { inicio, duracionMin, estado } | null` (se toleran ausentes →
  `nueva`). `rut` y `correo` pueden ser null (*"Sin RUT"*, *"Sin correo"*) y `motivo` puede llegar `''`
  (no se muestra).
- **En la lista:** badge *"Pide otra hora"* y *"Su hora actual: <fecha>, <hora> · <duración> · <estado>"*.
- **Aceptar una de otra hora mueve la cita original** (mismo id, vuelve a `pendiente`, recordatorios
  reprogramados): el modal pide **solo fecha y hora** y envía `{ inicio }`. Para una `nueva` no cambia
  nada. La respuesta tiene la misma forma `{ solicitud, cita }`.
- **Estado `descartada`** (terminal, lo pone el sistema cuando la cita original se cancela o se cierra
  con la solicitud aún abierta): pestaña *Descartadas* y *"Descartada: <fecha> · La cita original se
  canceló o se cerró antes de que alguien respondiera."*
- La píldora del sidebar cuenta las `recibida` de los dos tipos.

## Pendientes

| Qué | Nota |
|-----|------|
| **Prueba manual contra el backend real** | Aceptar (con y sin choque), rechazar, 409 con dos pestañas, 404, sesión sin `tenantSlug`. Fase 3: aceptar y rechazar una de otra hora; ver una descartada tras cancelar la cita. |
| Ver la cita desde una solicitud aceptada | `citaId` viene, pero el voucher necesita la fila; se ofrece "Ver en la agenda" en su lugar. |
| Paginación | El backend la agregará si hace falta (tope 100). |
| Contador sin listar | No hay endpoint de conteo; se cuenta la lista. |

## Deudas técnicas asociadas

- [DTF-06](../Deudas/DTF-06.md) — `DURACION_MAXIMA_MIN` y `TOPE_BANDEJA` copiados del backend.
- [DTF-07](../Deudas/DTF-07.md) — la hora elegida al aceptar se interpretaba en la zona del navegador.
  **Cerrada** el 2026-10-06: se interpreta en hora de Chile, y aceptar rechaza un día pasado (error en
  *Fecha*) o una hora de hoy que ya pasó (error en *Hora*) con *"Elige una fecha y hora futuras."*, igual
  que el modal "Nueva cita".
- `DT-18` (backend) — límite de tasa de la ruta pública: bloquea publicar el enlace.
- `DT-13` (backend) — el backend acepta citas en el pasado; el front lo impide al aceptar.
