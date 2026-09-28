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
| Fecha + hora | Obligatorias, **futuras** (el backend aceptaría el pasado, DT-13). Bloques de `BLOQUES_HORARIOS`. | — |
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
Copy: *"No se creará ninguna cita … El paciente no recibe ningún aviso desde Citia: si corresponde,
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

## Pendientes

| Qué | Nota |
|-----|------|
| **Prueba manual contra el backend real** | Aceptar (con y sin choque), rechazar, 409 con dos pestañas, 404, sesión sin `tenantSlug`. |
| Ver la cita desde una solicitud aceptada | `citaId` viene, pero el voucher necesita la fila; se ofrece "Ver en la agenda" en su lugar. |
| Paginación | El backend la agregará si hace falta (tope 100). |
| Contador sin listar | No hay endpoint de conteo; se cuenta la lista. |

## Deudas técnicas asociadas

- [DTF-06](../Deudas/DTF-06.md) — `DURACION_MAXIMA_MIN` y `TOPE_BANDEJA` copiados del backend.
- [DTF-07](../Deudas/DTF-07.md) — la hora elegida al aceptar se interpreta en la zona del navegador.
- `DT-18` (backend) — límite de tasa de la ruta pública: bloquea publicar el enlace.
- `DT-13` (backend) — el backend acepta citas en el pasado; el front lo impide al aceptar.
