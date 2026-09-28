# Agenda del profesional — semana y lista, con aviso de solapamiento

**Estado:** ✅ Implementado (2026-09-25) · ⚠️ verificado solo con respuestas simuladas: el backend del
cierre de Fase 1 se implementa en paralelo
**Rama:** `feature/us02-cierre-fase1` (sin commit)
**Origen:** cierre de Fase 1 de US-02 — decisión 3 del contrato (*agenda: vista semanal + lista*) y
[ADR-11](../../../citia-backend/context/Decisions/ADR-11.md) (*solapamiento: avisar y permitir*)
**Backend:** [`us02-gestion-citas.md` § Cierre de Fase 1 (a) y (b)](../../../citia-backend/context/Features/us02-gestion-citas.md#cierre-de-fase-1--contrato-2026-09-25)
**Feature:** `src/features/agenda/` · **Ruta:** `/agenda`

---

## Qué hace

Nueva entrada **Agenda** en el sidebar (reemplaza el ítem visual "Calendario"). Dos vistas sobre el
mismo endpoint:

| Vista | Qué muestra | Navegación |
|-------|-------------|------------|
| **Semana** (por defecto) | Grilla lunes–domingo con una fila por hora; cada cita es un bloque del alto de su duración. Hoy resaltado. | ‹ semana anterior · **Hoy** · semana siguiente › |
| **Lista** | Citas del rango agrupadas por día, con la misma fila que "Citas de hoy". | Desde / Hasta (máx. 42 días) · atajos *Próximos 7 / 30 días* |

- **Filtro por estado** (las dos vistas): todos · vigentes (pendientes y confirmadas) · cada uno de
  los seis estados. Es del cliente: el endpoint trae todos.
- **Clic en una cita → el voucher de siempre** ([gestionar-cita](gestionar-cita.md)), con reagendar y
  cancelar. Desde la agenda se abre con `listaDelDia = false`: no dice "ya no aparece en tu lista de
  hoy".
- **"+ Nueva cita"** en el encabezado (mismo modal que el dashboard).
- La tarjeta "Citas de hoy" del dashboard gana **"Ver agenda"** (antes "Ver calendario", sin handler).
- Modo, semana, rango y filtro **se conservan** al ir a otra sección y volver (se pierden al recargar).

---

## Contrato con el backend

`GET /citas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` (con token) → `CitaDashboardDto[]`, la forma de
`/citas/hoy` **más `fecha`** (`YYYY-MM-DD` en la zona de la clínica).

| Regla | Dónde vive en el front |
|-------|------------------------|
| Se mandan **fechas**, no instantes: el backend resuelve medianoches en `APP_TZ` | `getAppointmentsInRange()` en `entities/appointment/api/appointmentApi.ts` |
| Rango inclusivo, `hasta ≥ desde`, **máx. 42 días** | `validarRango()` repite las dos reglas **antes** de pedir (mismos textos que el 400); `MAX_DIAS_RANGO = 42` es copia a mano ([DTF-06](../Deudas/DTF-06.md)) |
| Se agrupa por **`fecha` del backend**, nunca derivándola de `inicio` en el navegador (ADR-07) | `AgendaAppointment.date` (`toAgendaAppointment`) y `agruparPorFecha()` |
| Orden `inicio ASC`: el front no reordena dentro de un día | La lista solo ordena los **días** por su `fecha` |

`fecha` se agregó como campo opcional de `CitaDashboardDto` en el front: en `/hoy` de un backend
anterior puede faltar y el dashboard no lo usa. En la agenda y en los avisos es obligatorio
(`CitaAgendaDto`).

---

## Cómo se mantiene al día

Store `useAgendaAppointments` (`entities/appointment/model/`), gemelo de `useTodayAppointments`:
guarda el rango pedido y **refrescar = volver a pedir el rango**. Mismas reglas que US-02.09:

| Disparador | Qué hace |
|------------|----------|
| Entrar a `/agenda`, cambiar de semana o de rango | `setRange()` (pide solo si el rango cambió) |
| Crear una cita desde "+ Nueva cita" | `reload()` |
| Reagendar o cancelar desde el voucher | `reload()` al recibir `changed` |
| Volver a la pestaña | `reloadIfStale(30 s)` |

- Una respuesta fuera de orden se descarta (gana el último pedido).
- Al navegar de semana no se vuelve al esqueleto: se ve "Actualizando…" sobre la semana anterior.
- Si falla una recarga con datos cargados, se conservan con un aviso y "Reintentar".

---

## Grilla semanal: decisiones propias

- **Sin librería de calendario** (no había ninguna): grilla CSS + posiciones calculadas en
  `features/agenda/model/agenda.ts`. 56 px por hora; bloque mínimo de 22 px.
- **Horas visibles:** 08:00–20:00, ampliadas automáticamente si alguna cita cae fuera.
- **Citas que se cruzan, lado a lado** (`distribuirEnCarriles`): con ADR-11 los cruces existen. Mismo
  criterio de cruce que el backend: intervalo semiabierto, así que **dos citas pegadas no comparten
  grupo** y cada una usa el ancho completo. Las canceladas también ocupan carril (se ven tachadas).
- Una cita que pasa la medianoche se dibuja **recortada** a su día (entra en la agenda por su `inicio`,
  igual que en el backend).
- Colores por estado = los del badge (`STATUS_BADGE_VARIANT`); tachado = cancelada, atenuado = pasada
  o terminal (mismo código visual que "Citas de hoy").
- En pantallas angostas la grilla se desplaza **dentro de la tarjeta** (mín. 780 px); la página no
  tiene scroll horizontal.
- La semana empieza el lunes. "Hoy" (semana inicial, resaltado, atajos) sale de la zona del navegador
  ([DTF-07](../Deudas/DTF-07.md)); las citas se ubican siempre por `fecha`/`hora` del backend.

---

## Aviso de solapamiento (ADR-11)

Las respuestas de `POST /citas`, `PATCH /citas/:id/reagendar`, `PATCH /citas/:id` y
`POST /solicitudes/:id/aceptar` traen `avisos.solapamientos: CitaDashboardDto[]`.

- **No bloquea:** cuando se muestra, la operación ya se hizo. Copy: *"Esta cita se cruza con otra
  cita vigente del mismo profesional"* + la lista (día, hora, paciente, tipo, duración, estado) +
  *"El cambio ya quedó guardado: Citia no impide los cruces, solo avisa."*
- Componente único `AvisoSolapamiento` en `entities/appointment/ui/` (se ve igual en todos lados);
  si la lista viene vacía no pinta nada.
- **Tolera que `avisos` falte** (backend anterior, o transiciones que no lo traen como cancelar):
  `solapamientosDe(avisos)` devuelve `[]`.

| Dónde se muestra | Por qué ahí |
|------------------|-------------|
| Crear (dashboard y agenda) | El modal se cierra al guardar: el aviso queda sobre el contenido de la página, descartable. |
| Reagendar (voucher) | Dentro del voucher, bajo el mensaje de éxito. |
| Aceptar solicitud (bandeja) | Bajo el mensaje de éxito — ver [bandeja-solicitudes](bandeja-solicitudes.md). |
| Editar (`PATCH /citas/:id`) | **No aplica todavía:** el front no tiene UI de edición. |

---

## Layout del panel (cambio transversal)

Con tres vistas autenticadas, el sidebar dejó de ser parte de `DashboardPage`:

- `src/app/layouts/PanelLayout.vue` (sidebar + `<RouterView />`) es la **ruta padre** de `/`,
  `/agenda` y `/solicitudes`. `requiresAuth` va en el padre (vue-router lo mezcla en las hijas).
- `DashboardSidebar.vue` se movió a `src/app/layouts/PanelSidebar.vue`: Resumen, Agenda y Solicitudes
  son `RouterLink`; Pacientes y Citas anuladas siguen siendo visuales.
- Cada página sigue componiendo sus propios features (modal, voucher) y decide cuándo recargar.

---

## Pendientes

| Qué | Nota |
|-----|------|
| **Prueba manual contra el backend real** | Semana con cruces, citas pegadas, rango de 42 días y de 43 (400), reagendar a otra semana, crear con choque. |
| Vista mes | El tope de 42 días ya la permite; no se pidió. |
| Editar cita (duración) | El backend lo expone y trae `avisos`; el front no tiene la UI. |
| Zona horaria | Ver [DTF-07](../Deudas/DTF-07.md). |

## Deudas técnicas asociadas

- [DTF-06](../Deudas/DTF-06.md) — `MAX_DIAS_RANGO` copiado del backend.
- [DTF-07](../Deudas/DTF-07.md) — "hoy" y la fecha/hora elegida al crear/reagendar, en zona del navegador.
- `DT-12` (backend) — cerrada en diseño por ADR-11; el front ya consume el aviso.
