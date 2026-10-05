# Dashboard — resumen real y citas del día

**Estado:** ✅ Implementado y conectado (2026-09-24) · **sin datos de prueba desde el 2026-10-05** (lote 2
de la limpieza previa al release) · ⚠️ verificado solo con respuestas simuladas, sin prueba manual contra
el backend real
**Rama:** `feature/us02-voucher-dashboard` (lista del día) · `feature/frontend-prerelease` (lote 2, sin commit)
**Origen:** US-06 (el dashboard) + subtarea **US-02.09** de US-02 (que refleje los cambios) —
[plan](../us/02.09-dashboard-refleja-cambios.md) · lote 2: decisiones del usuario del 2026-10-05
**Backend:** [`us02-gestion-citas.md`](../../../citia-backend/context/Features/us02-gestion-citas.md) ·
[`us06-dashboard-citas.md`](../../../citia-backend/context/Features/us06-dashboard-citas.md)

---

## Qué muestra

`/` ("Resumen") ya **no tiene ninguna cifra inventada**: se borraron el API simulado
(`features/dashboard/api/dashboardApi.ts`), las métricas (ausentismo, horas e ingresos recuperados,
pacientes en riesgo, prepago), el gráfico de ausentismo y la actividad del motor. Cerró
[DTF-03](../Deudas/DTF-03.md).

| Widget | Qué muestra | De dónde sale |
|--------|-------------|---------------|
| Topbar | Fecha · "N citas hoy · N pendientes de confirmar" | `useTodayAppointments` (`GET /citas/hoy`) |
| **Citas hoy** (tarjeta 1) | Citas agendadas de hoy (no canceladas) y cuántas pendientes de confirmar | `useTodayAppointments`: **los mismos computed que el topbar**, sin pedido extra |
| **Próxima cita** (tarjeta 2) | Hora, paciente y tipo de la primera cita **vigente** (`pendiente`/`confirmada`) que empieza después de ahora, con "Ver cita" (abre el voucher); si no hay, *"No quedan citas hoy"* | La misma lista de `/citas/hoy`; "ahora" avanza solo cada minuto (`useAhora`) |
| **Próximos 7 días** (tarjeta 3) | Citas agendadas de hoy y los 6 días siguientes y la suma de su `duracionMin` ("Horas agendadas: 8 h 40 min") | `useProximasCitas` → `GET /citas?desde=hoy&hasta=hoy+6` |
| **Solicitudes por responder** (tarjeta 4) | Cuántas solicitudes `recibida` hay ("100+" en el tope), con "Ver solicitudes" → `/solicitudes` | `useSolicitudesRecibidas` (`GET /solicitudes?estado=recibida`), el mismo conteo que la píldora del sidebar |
| **Citas de hoy** (lista) | Las citas de hoy; **canceladas ocultas** por defecto (ver abajo) | `useTodayAppointments` |
| **Citas por semana** (columna) | Barras apiladas de las últimas 6 semanas lunes–domingo (la actual incluida): agendadas y canceladas. Cifra de agendadas sobre cada barra, detalle al pasar el mouse, tabla oculta para lectores de pantalla | `useHistorialCitas` → **un solo** `GET /citas?desde&hasta` de 42 días (el tope del backend) |
| **Recordatorios** (columna) | Activos / Apagados, momentos ("Se envían por correo 24 h y 2 h antes de cada cita"), aviso si es la configuración predeterminada, enlace a `/recordatorios` | `GET /recordatorios/configuracion` (`useResumenRecordatorios`) |

Cada widget tiene **carga** (esqueleto), **error con "Reintentar"** y **vacío**. Si una recarga falla con
datos ya cargados, se conservan y se avisa (mismo patrón que "Citas de hoy").

### Vocabulario de los conteos

- **Agendada** = cualquier cita que no esté cancelada (incluye asistió / no asistió). Es lo que cuentan
  el topbar, la tarjeta 1, la tarjeta 3 y la barra azul del gráfico, para que las cifras nunca se
  contradigan.
- **Vigente** = `pendiente` o `confirmada` (criterio del backend, `isActiveStatus`). Solo decide la
  "próxima cita".
- "Pendientes de confirmar" cuenta solo `pendiente`: las canceladas nunca entran.

### Decisiones propias

- La tarjeta 3 se llama **"Próximos 7 días"** y no "Esta semana": el gráfico ya usa "Esta semana" para la
  semana lunes–domingo, y las dos cifras serían distintas.
- Los dos rangos (`useProximasCitas`, `useHistorialCitas`) son stores Pinia del feature (fábrica en
  `model/useRangosCitas.ts`) para que la página pueda recargarlos igual que la lista del día. El rango se
  recalcula en cada recarga a partir de "hoy" del navegador ([DTF-07](../Deudas/DTF-07.md)); las citas
  se ubican por la `fecha` del backend.
- La configuración de recordatorios se pide cada vez que se monta la tarjeta (un cambio en
  `/recordatorios` se ve al volver). El `GET` y su DTO pasaron a `entities/recordatorio` porque lo leen
  dos features; `configurar-recordatorios` los reexporta.
- `useSolicitudesRecibidas` ganó `loading`/`error` (la píldora los ignora) y **no duplica pedidos**: si
  hay un conteo en curso, quien pide espera ese (el layout y el dashboard piden a la vez al entrar).
- Gráfico en CSS puro (sin librerías): azul `--color-primary` para agendadas, gris para canceladas (el
  mismo neutro del badge "Cancelada"), 2 px de separación entre segmentos, extremo superior redondeado.

---

## Canceladas ocultas en "Citas de hoy" (2026-10-05)

**Decisión del usuario que revierte la recomendación de US-02.09 §4** ("visibles y tachadas"):

- Por defecto la lista muestra solo las no canceladas. Al final, un enlace discreto **"Mostrar N
  canceladas"** las despliega (siguen **tachadas** y atenuadas); "Ocultar canceladas" las vuelve a esconder.
  Se olvida al salir del dashboard.
- El vacío pasa a ser *"No tienes citas vigentes hoy."* (también si solo hay canceladas; el enlace sigue
  abajo).
- El subtítulo queda en "N agendadas · N confirmadas · N pendientes"; las canceladas las cuenta el enlace.
- El riesgo que motivaba US-02.09 §4 (la fila "se esfuma" al cancelar) lo cubre el voucher, que queda
  abierto con *"Cita cancelada."*, y el enlace "Mostrar 1 cancelada" que aparece en la lista.

---

## Contrato con el backend

| Llamada | Uso |
|---------|-----|
| `GET /citas/hoy` → `[{ id, pacienteNombre, hora, inicio, duracionMin, tipoConsulta, estado, fecha? }]` | Lista, tarjetas 1 y 2, topbar |
| `GET /citas?desde&hasta` (máx. 42 días, todos los estados) | Tarjeta 3 (7 días) y gráfico (42 días) |
| `GET /solicitudes?estado=recibida` | Tarjeta 4 (largo de la lista; no hay endpoint de conteo) |
| `GET /recordatorios/configuracion` | Tarjeta de Recordatorios |

`toAppointment()` en `entities/appointment/api/appointmentApi.ts` es el **único** lugar que conoce los
nombres del backend de las citas.

---

## Estados: los seis del backend, sin inventos

Etiquetas y colores viven en `entities/appointment/model/status.ts` y los usan **la lista, la agenda y el
voucher**, para que una cita se vea igual en los tres lugares. `EstadoCita` existe una sola vez.

| Estado | Etiqueta | Badge | Nota |
|--------|----------|-------|------|
| `pendiente` | Pendiente | warning | |
| `confirmada` | Confirmada | success | |
| `cancelada` | Cancelada | neutral | oculta por defecto; si se muestra, **tachada** y atenuada |
| `asistio` | Asistió | info | atenuada, solo lectura |
| `no_asistio` | No asistió | danger | atenuada, solo lectura |
| `ghosting` | **Sin respuesta** | danger | ningún flujo lo produce hoy (no existe el job de cierre, DT-11) |

Las citas **pasadas** (`inicio + duración < ahora`) se atenúan, sin tacharse: tachar significa "cancelada".
Desde el voucher se puede **confirmar** y **registrar la asistencia** ([gestionar-cita](gestionar-cita.md)).

---

## Cómo se mantiene al día

Refrescar = **volver a pedir**, nunca parchear la lista a mano. La página (`DashboardPage`) compone:

| Disparador | Qué hace |
|------------|----------|
| Montar el dashboard | `reload()` de hoy, próximos 7 días y 6 semanas; `refreshIfStale(30 s)` del conteo de solicitudes |
| Crear una cita desde "+ Nueva cita" | `reload()` de los tres rangos de citas |
| Reagendar, cancelar, **confirmar, asistió o no asistió** desde el voucher | `reload()` de los tres al recibir `changed` |
| Volver a la pestaña (`visibilitychange`) | `reloadIfStale(30 s)` de los tres; el conteo de solicitudes lo refresca `PanelLayout` |

- Una respuesta que llega **fuera de orden** se descarta (gana la última petición lanzada).
- **Sin polling** ni tiempo real (RF-05, fuera del MVP).

Casos que se ven raros y son correctos:

- Una cita **reagendada a otro día desaparece** de la lista: el voucher lo avisa ("Ya no aparece en tu
  lista de hoy").
- Una cita **creada para otro día** no aparece en la lista, pero sí suma en "Próximos 7 días" y en el gráfico.

---

## Historia

- **2026-09-24 (US-02.09):** la lista "Citas de hoy" deja los datos fijos y consume `GET /citas/hoy`;
  topbar con fecha y conteos reales; el modal "Nueva cita" pasa a `DashboardPage`.
- **2026-09-25 (cierre de Fase 1):** el sidebar lo pone `app/layouts/PanelLayout.vue`; "Ver calendario"
  pasa a **"Ver agenda"**; aviso de solapamiento (ADR-11) tras crear.
- **2026-10-05 (limpieza, lote 1):** fuera del sidebar y del topbar los datos fijos — ver [login-sesion](login-sesion.md).
- **2026-10-05 (limpieza, lote 2):** fuera métricas, ausentismo y actividad; cuatro tarjetas reales,
  "Citas por semana", tarjeta de Recordatorios, canceladas ocultas, confirmar y asistencia en el voucher.

## Pendientes

| Qué | Nota |
|-----|------|
| **Prueba manual contra el backend real** | Crear hoy/mañana, cancelar (ver "Mostrar 1 cancelada"), reagendar, confirmar → asistió, volver el foco; comparar las cifras de las tarjetas con la agenda. Solo se verificó con respuestas simuladas. |
| Métricas de ausentismo | Requieren RF-08 (comportamiento del paciente); cuando exista, se agregan como tarjeta nueva, no sobre datos fijos. |
| Móvil | Las tarjetas pasan a 2 y 1 columna; el resto del dashboard (sidebar fijo) sigue sin arreglarse para móvil. |
| Zona horaria | "Hoy", los rangos y "ahora" salen del navegador — [DTF-07](../Deudas/DTF-07.md). |

## Deudas técnicas asociadas

- [DTF-03](../Deudas/DTF-03.md) — **cerrada** el 2026-10-05 (no queda ningún dato de prueba).
- [DTF-06](../Deudas/DTF-06.md) — `MAX_DIAS_RANGO` (42) copiado del backend: el gráfico de 6 semanas depende de él.
- [DTF-07](../Deudas/DTF-07.md) — zona del navegador = zona de la clínica.
- `DT-29` (backend) — `GET /citas/hoy` y `GET /citas?desde&hasta` ya se consumen.
