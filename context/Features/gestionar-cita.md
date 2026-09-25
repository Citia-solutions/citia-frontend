# Gestionar cita — voucher con reagendar y cancelar

**Estado:** ✅ Implementado y conectado (2026-09-24) · ⚠️ sin prueba manual contra el backend real
**Rama:** `feature/us02-voucher-dashboard` (sin commit)
**Origen:** subtarea **US-02.08** de US-02 — [plan](../us/02.08-voucher-cita.md). Cumple además el
último criterio de US-06: *"clic en una cita → detalle con opciones de reagendar/cancelar"*.
**Backend:** [`us02-gestion-citas.md` § Detalle](../../../citia-backend/context/Features/us02-gestion-citas.md#detalle-de-la-cita-us-0208) ·
[plan backend](../../../citia-backend/context/US/02.08-voucher-cita.md)
**Feature:** `src/features/gestionar-cita/`

---

## Qué hace

Desde "Citas de hoy", **"Ver cita"** abre un modal tipo voucher con:

- **Cita:** fecha, hora, duración, tipo de consulta y estado (mismo badge que la lista).
- **Paciente:** nombre, RUT (formateado), teléfono y correo.
- **Acciones:** **Reagendar** y **Cancelar**, cada una con su vista de confirmación y motivo opcional.

Se abre **al instante** con los datos de la fila y se completa con `GET /citas/:id`; mientras carga
(o si falla el detalle) los botones quedan deshabilitados.

---

## Contrato con el backend

| Llamada | Uso |
|---------|-----|
| `GET /citas/:id` → `{ id, estado, inicio, hora, duracionMin, tipoConsulta, paciente: { id, nombre, rut, telefono, correo }, accionesPermitidas }` | pintar el voucher |
| `PATCH /citas/:id/reagendar` — `{ inicio, motivo? }` | reagendar |
| `PATCH /citas/:id/cancelar` — `{ motivo? }` | cancelar |

`toAppointmentDetail()` en `entities/appointment/api/appointmentApi.ts` traduce el detalle al modelo
del front. `motivo` **se omite** del cuerpo cuando va vacío.

### Los botones los decide el backend

**Reagendar** y **Cancelar** se habilitan solo si están en `accionesPermitidas`. El front **no
deriva** qué es legal a partir del `estado`: esa regla vive en la entidad `Cita` del backend
(ADR-04) y copiarla aquí era la forma de que un botón habilitado terminara en 409. Un botón
deshabilitado explica por qué: *"No disponible en el estado actual de la cita"*.

`isTerminalStatus()` existe en el front, pero **solo para presentación** (atenuar, explicar por qué
no hay acciones), nunca para habilitar.

### Después de cada acción

1. Se **vuelve a pedir el detalle** (`GET /citas/:id`): las respuestas de las transiciones no traen
   `accionesPermitidas` a propósito.
2. Se emite `changed` → el dashboard hace `reload()` ([dashboard-citas-del-dia](dashboard-citas-del-dia.md)).
3. El voucher **queda abierto** mostrando el resultado.

**Un 409** (la cita cambió entre que se abrió y se actuó: otro profesional, el paciente vía
US-02.07, el job de cierre) muestra el mensaje, recarga el detalle y recarga la lista.

---

## Copy que carga significado

| Texto | Por qué importa |
|-------|-----------------|
| *"La cita seguirá pendiente de confirmación."* (al reagendar) | Reagendar **devuelve la cita a `pendiente`** aunque estuviera confirmada (ADR-09 §5): el paciente confirmó otra hora. Sorprende, así que se dice antes de confirmar. |
| *"Ya no aparece en tu lista de hoy."* | Tras reagendar a otro día la fila desaparece del dashboard; sin el aviso parece que la cita se borró. |
| *"Esta cita cambió mientras la tenías abierta y ya no admite esta acción."* | El 409. No culpa al usuario ni habla de "estado inválido". |
| *"Esta cita ya no está disponible."* | El 404. No distingue "no existe" de "es de otra organización", igual que el backend. |
| *"Sin respuesta"* (estado `ghosting`) | Jerga interna fuera; el profesional entiende "no respondió". |

---

## Reglas de la interfaz

- **`inicio` viaja siempre con zona explícita** (DT-14): `aInicioISO()`, movida a
  `shared/lib/fecha.ts` y compartida con el modal de creación. Sale como instante `…Z`, que es un
  desfase explícito.
- **No se puede reagendar al pasado** desde la UI. El backend lo acepta en silencio (DT-13); la
  validación se repite al enviar por si el formulario quedó abierto hasta pasada esa hora.
- **Selector de hora** del modal de creación (bloques en `shared/config/bloquesHorarios.ts`),
  prellenado con la hora actual; si esa hora no es un bloque, se agrega como opción.
- **Motivo:** opcional, máximo **300** caracteres con contador. El backend aplica el mismo límite
  (`@MaxLength(300)` en `MotivoCitaDto` y `ReagendarCitaDto`) — copia a mano, ver
  [DTF-06](../Deudas/DTF-06.md).
- **Accesible:** foco inicial en "Volver", `Tab` no sale del diálogo, `Esc` cierra (salvo enviando),
  el foco vuelve a la fila al cerrar. Pantalla completa por debajo de 560 px.

---

## Fuera de esta entrega

| Qué | Nota |
|-----|------|
| Historial (`GET /citas/:id/historial`) | Segunda entrega, según el plan. |
| Confirmar, asistencia, inasistencia, editar | El backend ya los anuncia en `accionesPermitidas`; no se muestran todavía. |
| Aviso de solapamiento | El backend lo permite (DT-12); mejor no avisar que avisar a medias. |
| "Generar enlace para el paciente" | Depende de US-02.07 y [ADR-10](../../../citia-backend/context/Decisions/ADR-10.md) (propuesto). |

## Pendientes

- **Prueba manual contra el backend real** (crear, cancelar, reagendar dentro de hoy y a otro día,
  forzar un 409 con dos pestañas).

## Deudas técnicas asociadas

- [DTF-06](../Deudas/DTF-06.md) — límite del motivo copiado del DTO.
- [DTF-07](../Deudas/DTF-07.md) — la fecha/hora elegida se interpreta en la zona del navegador.
- `DT-12` / `DT-13` (backend) — solapamiento y horas pasadas aceptadas en silencio.
- `DT-29` (backend) — `GET :id`, `reagendar` y `cancelar` ya se consumen.
