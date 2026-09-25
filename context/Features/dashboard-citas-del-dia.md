# Dashboard — citas del día conectadas

**Estado:** ✅ Implementado y conectado (2026-09-24) · ⚠️ sin prueba manual contra el backend real
**Rama:** `feature/us02-voucher-dashboard` (sin commit)
**Origen:** US-06 (el dashboard) + subtarea **US-02.09** de US-02 (que refleje los cambios) —
[plan](../us/02.09-dashboard-refleja-cambios.md)
**Backend:** [`us02-gestion-citas.md`](../../../citia-backend/context/Features/us02-gestion-citas.md) ·
[`us06-dashboard-citas.md`](../../../citia-backend/context/Features/us06-dashboard-citas.md)

---

## Qué hace

La tarjeta **"Citas de hoy"** de `/` deja de mostrar datos de prueba y lista las citas reales del
profesional logueado. Cada fila tiene un botón **"Ver cita"** que abre el voucher
([gestionar-cita](gestionar-cita.md)).

**Lo que sigue con datos de prueba:** métricas, ausentismo semanal, actividad del motor y la píldora
"Citas anuladas" del sidebar. No tienen endpoint en el backend — ver [DTF-03](../Deudas/DTF-03.md).

---

## Contrato con el backend

`GET /citas/hoy` (con token) → `[{ id, pacienteNombre, hora, inicio, duracionMin, tipoConsulta, estado }]`

`toAppointment()` en `entities/appointment/api/appointmentApi.ts` es el **único** lugar que conoce
los nombres del backend: si el DTO renombra un campo, se toca solo ahí.

---

## Estados: los seis del backend, sin inventos

El modelo adopta exactamente los estados de la máquina del backend (ADR-04). `recuperada` y
`riesgo_alto`, que venían del diseño de US-06, **salieron del código**: no son estados de una cita
sino atributos de otra naturaleza (un cupo reasignado, una reputación), y el backend no los conoce.

| Estado | Etiqueta | Badge | Nota |
|--------|----------|-------|------|
| `pendiente` | Pendiente | warning | |
| `confirmada` | Confirmada | success | |
| `cancelada` | Cancelada | neutral | fila **tachada** y atenuada; sigue visible |
| `asistio` | Asistió | info | |
| `no_asistio` | No asistió | danger | |
| `ghosting` | **Sin respuesta** | danger | "ghosting" es jerga interna; el profesional entiende "no respondió" |

Etiquetas y colores viven en `entities/appointment/model/status.ts` y los usan **la lista y el
voucher**, para que una cita se vea igual en los dos lugares. `EstadoCita` existe una sola vez.

Las citas **pasadas** (`inicio + duración < ahora`) se atenúan, sin tacharse: tachar significa
"cancelada".

---

## Cómo se mantiene al día

La lista vive en un store Pinia (`entities/appointment/model/useTodayAppointments.ts`) con
`reload()`. **Refrescar = volver a pedir `/citas/hoy`**, nunca parchear la lista a mano: así el orden,
el filtro del día y los estados los decide siempre el backend.

| Disparador | Qué hace |
|------------|----------|
| Montar el dashboard | `reload()` |
| Crear una cita desde "+ Nueva cita" | `reload()` (antes el evento `citaCreada` se perdía) |
| Reagendar o cancelar desde el voucher | `reload()` al recibir el evento `changed` |
| Volver a la pestaña (`visibilitychange`) | `reloadIfStale(30 s)`: como mucho una vez cada 30 s |

- Una respuesta que llega **fuera de orden** se descarta (gana la última petición lanzada).
- **Sin polling.** Hasta que el paciente pueda cambiar citas (US-02.07) no hay nada que lo justifique;
  volver el foco cubre lo que hizo otra persona u otra pestaña.
- **Sin tiempo real.** Notificaciones en vivo son RF-05 (fuera del MVP).
- Si falla una recarga con datos ya cargados, **se conservan** y se muestra un aviso con reintento.

Casos que se ven raros y son correctos:

- Una cita **reagendada a otro día desaparece** de la lista: el voucher lo avisa ("Ya no aparece en
  tu lista de hoy").
- Una cita **creada para otro día** no aparece tras crearla. No se avisa (decisión del plan).

---

## Otros cambios

- El subtítulo del topbar usa la fecha real y los conteos del store (antes era texto fijo).
- El modal "Nueva cita" pasó del topbar a `DashboardPage`, que es quien orquesta modal, voucher y
  lista.
- `esPasado` de `HorarioStep.vue` (flujo público) ahora compara en zona local: de noche en Chile
  marcaba el día de hoy como pasado.

---

## Pendientes

| Qué | Nota |
|-----|------|
| **Prueba manual contra el backend real** | Crear hoy/mañana, cancelar, reagendar dentro de hoy y a otro día, volver el foco. Solo se verificó con respuestas simuladas. |
| Métricas, ausentismo, actividad, "Citas anuladas" | Sin endpoint — [DTF-03](../Deudas/DTF-03.md). |
| Móvil | El dashboard ya se desbordaba antes (sidebar de 72 px + relleno de tarjetas); no se arregló aquí. |
| Zona horaria | Se asume que la del navegador es la de la clínica — [DTF-07](../Deudas/DTF-07.md). |

## Deudas técnicas asociadas

- [DTF-03](../Deudas/DTF-03.md) — **parte de citas cerrada** por esta feature; quedan las otras tres.
- [DTF-07](../Deudas/DTF-07.md) — zona del navegador = zona de la clínica.
- `DT-29` (backend) — `GET /api/citas/hoy` ya se consume.
