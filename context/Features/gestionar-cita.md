# Gestionar cita — voucher con reagendar, cancelar, confirmar y asistencia

**Estado:** ✅ Implementado y conectado (2026-09-24) · ⚠️ sin prueba manual contra el backend real
**Rama:** `feature/us02-voucher-dashboard` (sin commit)
**Origen:** subtarea **US-02.08** de US-02 — [plan](../us/02.08-voucher-cita.md). Cumple además el
último criterio de US-06: *"clic en una cita → detalle con opciones de reagendar/cancelar"*.
**Backend:** [`us02-gestion-citas.md` § Detalle](../../../citia-backend/context/Features/us02-gestion-citas.md#detalle-de-la-cita-us-0208) ·
[plan backend](../../../citia-backend/context/US/02.08-voucher-cita.md)
**Feature:** `src/features/gestionar-cita/`
**Lote 2 de la limpieza previa al release (2026-10-05):** botones **Confirmar**, **Asistió** y **No
asistió** — ver [Confirmación y asistencia](#confirmación-y-asistencia-2026-10-05). Asistió / No asistió
solo desde la hora de inicio (bloqueo del front, mismo día).
**Fase 3 (2026-10-14):** quién confirmó / canceló, nota *"El paciente pidió otra hora"* e *"Invalidar
enlace del paciente"* — ver [Cambios de la Fase 3](#cambios-de-la-fase-3--respuesta-del-paciente-2026-10-14).
**US-07.01, Fase 5 (2026-10-19, `feature/fase5-registro-hechos`, sin commit):** Asistió / No asistió
también sobre una **pendiente** que ya empezó (sin Confirmar), el backend exige la hora de inicio, y
*"¿Quién lo pidió?"* obligatoria al cancelar y reagendar — ver
[Cambios de US-07.01](#cambios-de-us-0701--registro-de-hechos-2026-10-19). Lo que esa sección corrige
manda sobre lo que dicen las secciones anteriores.

---

## Qué hace

Desde "Citas de hoy", **"Ver cita"** abre un modal tipo voucher con:

- **Cita:** fecha, hora, duración, tipo de consulta y estado (mismo badge que la lista).
- **Paciente:** nombre, RUT (formateado), teléfono y correo — con **Editar** (Fase 2).
- **Recordatorios por correo** (Fase 2): estado de cada recordatorio — ver
  [recordatorios](recordatorios.md#estado-en-el-voucher).
- **Confirmación / Asistencia** (2026-10-05): **Confirmar cita**, **Asistió** y **No asistió**, según
  `accionesPermitidas`. Desde US-07.01, Asistió / No asistió también sobre una pendiente que ya empezó.
- **Acciones:** **Reagendar** y **Cancelar**, cada una con su vista de confirmación, *"¿Quién lo
  pidió?"* (obligatoria, US-07.01) y motivo opcional.

Se abre **al instante** con los datos de la fila y se completa con `GET /citas/:id`; mientras carga
(o si falla el detalle) los botones quedan deshabilitados.

---

## Contrato con el backend

| Llamada | Uso |
|---------|-----|
| `GET /citas/:id` → `{ id, estado, inicio, hora, duracionMin, tipoConsulta, paciente: { id, nombre, rut, telefono, correo }, accionesPermitidas }` | pintar el voucher |
| `PATCH /citas/:id/reagendar` — `{ inicio, motivo?, pedidoPor }` | reagendar (`pedidoPor` desde US-07.01) |
| `PATCH /citas/:id/cancelar` — `{ motivo?, pedidoPor }` | cancelar (`pedidoPor` desde US-07.01) |
| `PATCH /citas/:id/confirmar` (sin cuerpo) | pendiente → confirmada (2026-10-05) |
| `PATCH /citas/:id/asistencia` (sin cuerpo) | pendiente \| confirmada → asistio, terminal. Desde la hora de inicio; antes, 409 (US-07.01) |
| `PATCH /citas/:id/inasistencia` (sin cuerpo) | confirmada → no_asistio · pendiente → ghosting, terminales. Desde la hora de inicio; antes, 409 (US-07.01) |

`toAppointmentDetail()` en `entities/appointment/api/appointmentApi.ts` traduce el detalle al modelo
del front. `motivo` **se omite** del cuerpo cuando va vacío; `pedidoPor` (`'paciente' | 'profesional'`)
va siempre: en la API es opcional, pero el front no envía sin él.

### Los botones los decide el backend

**Reagendar** y **Cancelar** se habilitan solo si están en `accionesPermitidas`; **Confirmar**,
**Asistió** y **No asistió** solo **aparecen** si están ahí. El front **no
deriva** qué es legal a partir del `estado`: esa regla vive en la entidad `Cita` del backend
(ADR-04) y copiarla aquí era la forma de que un botón habilitado terminara en 409. Un botón
deshabilitado explica por qué: *"No disponible en el estado actual de la cita"*.

`isTerminalStatus()` existe en el front, pero **solo para presentación** (atenuar, explicar por qué
no hay acciones), nunca para habilitar.

### Después de cada acción

1. Se **vuelve a pedir el detalle** (`GET /citas/:id`): las respuestas de las transiciones no traen
   `accionesPermitidas` a propósito.
2. Se emite `changed` → el dashboard recarga hoy, próximos 7 días y 6 semanas
   ([dashboard-citas-del-dia](dashboard-citas-del-dia.md)); la agenda recarga su rango.
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
- **Selector de hora** del modal de creación (bloques en `shared/config/bloquesHorarios.ts`: 1 h, de
  07:00 a 21:00 desde el 2026-10-05), prellenado con la hora actual; si esa hora no es un bloque, se
  agrega como opción.
- **La cita debe terminar a más tardar a las 22:00** (`FIN_DE_JORNADA`, 2026-10-05): como reagendar
  conserva la duración, una de 90 min no se puede mover a las 21:00 (*"…Elige una hora más temprana."*).
- **Motivo:** opcional, máximo **300** caracteres con contador. El backend aplica el mismo límite
  (`@MaxLength(300)` en `MotivoCitaDto` y `ReagendarCitaDto`) — copia a mano, ver
  [DTF-06](../Deudas/DTF-06.md).
- **Accesible:** foco inicial en "Volver", `Tab` no sale del diálogo, `Esc` cierra (salvo enviando),
  el foco vuelve a la fila al cerrar. Pantalla completa por debajo de 560 px.

---

## Fuera de esta entrega

| Qué | Nota |
|-----|------|
| Historial (`GET /citas/:id/historial`) | Segunda entrega, según el plan. Desde US-07.01 cada cambio trae además `pedidoPor`; el front sigue sin consumir la ruta, así que no tiene tipo propio. |
| ~~Confirmar, asistencia, inasistencia~~ | ✅ Hechos el 2026-10-05 (ver abajo). |
| Editar (duración, tipo) | El backend lo anuncia en `accionesPermitidas`; no se muestra todavía. |
| ~~Aviso de solapamiento~~ | ✅ Hecho en el cierre de Fase 1 (ADR-11): tras reagendar, el voucher lista las citas con las que choca — ver [agenda-profesional](agenda-profesional.md#aviso-de-solapamiento-adr-11). |
| ~~"Generar enlace para el paciente"~~ | Descartado en la Fase 3 (decisión E4): el enlace lo emite el sistema al enviar el primer recordatorio y el voucher solo ofrece **invalidarlo** (ver abajo). |

## Cambios del cierre de Fase 1 (2026-09-25)

- El voucher también se abre desde la **agenda** (`/agenda`). Prop nueva `listaDelDia` (por defecto
  `true`): en `false` no dice *"Ya no aparece en tu lista de hoy"* ni lo anticipa en el formulario de
  reagendar.
- `CitaActualizada` gana `avisos?` (ADR-11); tras reagendar se muestra `AvisoSolapamiento`.

## Cambios de la Fase 2 — recordatorios (2026-10-04)

Rama `feature/fase2-recordatorios`. Detalle completo en [recordatorios](recordatorios.md).

| Qué | Dónde |
|-----|-------|
| Sección **Recordatorios por correo** bajo *Contacto*: momento, badge de estado, hora y motivo en español | `ui/RecordatoriosCita.vue` (presentacional) + `model/useRecordatoriosCita.ts` (`GET /citas/:id/recordatorios`) |
| **Reintentos cortos** (cada 2,5 s, hasta 4) mientras el backend programa: al abrir una cita vigente sin recordatorios, tras reagendar y tras cancelar. Se cancelan al cerrar | `useRecordatoriosCita.ts` (`hayAlguno`, `reprogramados`, `ningunoProgramado`) |
| Vista **Contacto** (cuarta vista, como Reagendar/Cancelar): completar o corregir teléfono y correo con `PATCH /pacientes/:id`. Solo viaja lo que cambió; 404 vuelve al detalle con el error; 400/401/red se muestran en la vista | `ui/EditarContactoForm.vue` + `model/useEditarContacto.ts`; `actualizarContactoPaciente()` en `api/gestionarCitaApi.ts` |
| *"Sin correo: no recibe recordatorios"* en *Contacto*, y **Agregar correo** / **Revisar correo** en la sección de recordatorios cuando aplica | `VoucherCita.vue`, `RecordatoriosCita.vue` |

**Copy nuevo en las confirmaciones:**

| Texto | Por qué importa |
|-------|-----------------|
| *"Sus recordatorios se reprograman para la nueva hora. El paciente no recibe un aviso aparte del cambio."* (reagendar) | Reagendar no le escribe al paciente: solo recibirá los recordatorios de la nueva hora. |
| *"Sus recordatorios pendientes se anulan. citiahealth no le avisa al paciente de la cancelación."* (cancelar) | Con recordatorios automáticos es fácil suponer que Citia también avisa las cancelaciones. No lo hace. |

`PATCH /pacientes/:id` vive en este feature porque el voucher es el único lugar del front donde se
edita un paciente (no hay ficha de pacientes todavía). Si aparece una, la llamada pasa a una entidad
`paciente`.

## Confirmación y asistencia (2026-10-05)

> **Desde US-07.01 la tabla de abajo es historia:** la pendiente que ya empezó y la confirmada que aún no
> empieza cambiaron. La tabla vigente está en
> [Cambios de US-07.01](#cambios-de-us-0701--registro-de-hechos-2026-10-19).

Lote 2 de la limpieza previa al release. Sección nueva entre *Recordatorios* y las acciones:

| La cita está… | `accionesPermitidas` trae | La sección muestra |
|---------------|---------------------------|--------------------|
| `pendiente`, todavía no empieza | `confirmar` | **Confirmación** — *"¿El paciente confirmó que vendrá? Márcala como confirmada."* + **Confirmar cita** |
| `pendiente` y **ya empezó** | `confirmar` (no `asistencia`) | *"Esta cita ya empezó y sigue pendiente. Para registrar si el paciente asistió, primero confírmala."* + **Confirmar cita** |
| `confirmada`, ya empezó | `asistencia`, `inasistencia` | **Asistencia** — *"¿El paciente vino a la cita?"* + **Asistió** / **No asistió** |
| `confirmada`, todavía no empieza | `asistencia`, `inasistencia` | **Asistencia** — *"Podrás registrar la asistencia cuando llegue la hora de la cita (HH:mm)."*, **sin botones** (bloqueo del front, ver [abajo](#bloqueo-de-la-asistencia-antes-de-la-hora-2026-10-05)) |
| `asistio` / `no_asistio` / `cancelada` | nada | Badge del estado y *"El paciente asistió a esta cita. Ya no admite cambios."* (solo lectura) |

- **Sin inventar transiciones:** la sección aparece solo cuando llega el detalle y con los botones que
  declara el backend. El front **no** ofrece marcar asistencia de una cita pendiente (ensuciaría el dato
  del futuro scoring, RF-08): primero hay que confirmarla, que es lo que dice el dominio (ADR-04).
- **Confirmación con un paso** (`ui/CambiarEstadoConfirm.vue`, mismo patrón que cancelar): foco inicial en
  "Volver", botón con spinner, el voucher no se cierra mientras se envía. Copy:

  | Acción | Texto |
  |--------|-------|
  | Confirmar | *"Úsalo cuando el paciente te confirme que vendrá (por teléfono, en persona o por correo). citiahealth no le envía ningún aviso."* · *"Sus recordatorios siguen programados igual."* |
  | Asistió / No asistió | *"La cita queda cerrada como «Asistió» / «No asistió» y ya no admite cambios. Esta acción no se puede deshacer."* · *"Sus recordatorios pendientes se anulan."* |

  El aviso ámbar *"Esta cita todavía no empieza…"* que tuvo esta vista se quitó el mismo día: ahora a
  Asistió / No asistió solo se llega desde la hora de inicio.

- **Después:** mensaje de éxito (*"Cita confirmada."*, *"Asistencia registrada: el paciente asistió."*,
  *"Inasistencia registrada: el paciente no asistió."*), se emite `changed` (dashboard y agenda recargan) y
  se vuelve a pedir el detalle. Tras Asistió / No asistió los recordatorios se vuelven a pedir hasta que
  ninguno quede `programado` (el backend los anula, `cita_terminal`).
- **409** (la cita cambió entretanto): *"Esta cita cambió mientras la tenías abierta y ya no admite esta
  acción."*, vuelta al detalle y recarga de detalle y listas, igual que reagendar y cancelar.
- Código: `cambiarEstadoCita(id, transicion)` en `api/gestionarCitaApi.ts`, `TransicionEstado` en
  `model/types.ts`, `model/useCambiarEstadoCita.ts`, `model/useYaEmpezo.ts`, `ui/CambiarEstadoConfirm.vue`,
  `ui/VoucherCita.vue`.

### Bloqueo de la asistencia antes de la hora (2026-10-05)

Decisión del usuario: **no se puede marcar Asistió ni No asistió antes de la hora de inicio**.

- Una cita `confirmada` cuyo `inicio` es posterior a ahora muestra la sección **Asistencia** solo con
  *"Podrás registrar la asistencia cuando llegue la hora de la cita (HH:mm)."* (la hora es `hora` del
  detalle, la misma que muestra el voucher). No hay botones, ni siquiera deshabilitados.
- **Al llegar la hora, con el voucher abierto, los botones aparecen solos** y el texto pasa a *"¿El
  paciente vino a la cita?"*. Lo hace `model/useYaEmpezo.ts`: un único `setTimeout` programado para
  `inicio` (no un intervalo) mientras el voucher está abierto; al volver a la pestaña también se
  recalcula. Usa `hasStarted` de `entities/appointment` (`inicio <= ahora`). No reutiliza `useAhora` del
  dashboard: es de otro feature (FSD) y avanza por minuto.
- **Confirmar** (pendiente → confirmada) sigue disponible en cualquier momento.
- Qué botones existen lo sigue decidiendo `accionesPermitidas`; el front solo agrega **cuándo**
  (`disponible()` en `VoucherCita.vue`). `abrirTransicion` repite la comprobación.
- ~~⚠️ **Es un bloqueo solo del frontend.**~~ Hasta US-07.01 el backend aceptaba `PATCH
  /citas/:id/asistencia` e `/inasistencia` antes de la hora. **Desde US-07.01 el dominio exige la hora**
  (409 `CitaAunNoComienzaError`) y `accionesPermitidas` no las declara antes: ver
  [Cambios de US-07.01](#cambios-de-us-0701--registro-de-hechos-2026-10-19).
- El desbloqueo ocurre en el instante `inicio` según el reloj del navegador (un instante: no depende de
  su zona); el texto muestra `hora`, de la clínica. Desde el 2026-10-06 todo lo demás del voucher (fecha
  larga, hora de término, recordatorios, "Ya no aparece en tu lista de hoy") también va en hora de Chile
  ([DTF-07](../Deudas/DTF-07.md), cerrada).

## Cambios de la Fase 3 — respuesta del paciente (2026-10-14)

Rama `feature/fase3-respuesta-paciente`. Detalle completo (contrato y copy) en
[responder-cita-paciente](responder-cita-paciente.md#voucher-featuresgestionar-cita).

| Qué | Dónde |
|-----|-------|
| *"Confirmada por el paciente"* / *"Confirmada por ti"* / *"Cancelada por el paciente"* bajo el badge, desde `confirmadaPor` / `canceladaPor` de `GET /citas/:id` (opcionales: si no vienen, nada) | `VoucherCita.vue` (`textoActor`); `confirmedBy` / `cancelledBy` en `entities/appointment` |
| Nota *"El paciente pidió otra hora: <preferencia>"* con *"Responder en Solicitudes"* (`/solicitudes`), desde `GET /solicitudes?citaOrigenId=<id>&estado=recibida`. Se recarga tras cada acción; al reagendar desde el voucher el backend da la solicitud por atendida y la nota desaparece | `model/useSolicitudOtraHora.ts` + `getSolicitudOtraHoraAbierta` de `entities/solicitud` |
| Sección *Enlace del paciente* con **Invalidar enlace del paciente** (solo cita vigente) → vista de confirmación → `POST /citas/:id/enlace/invalidar` (204) | `ui/InvalidarEnlaceConfirm.vue`, `model/useInvalidarEnlace.ts`, `invalidarEnlacePaciente()` en `api/gestionarCitaApi.ts` |

## Cambios de US-07.01 — registro de hechos (2026-10-19)

Rama `feature/fase5-registro-hechos` (sin commit) · plan del front en
[`us/07.01-registro-hechos.md`](../us/07.01-registro-hechos.md) · contrato en el
[plan del backend](../../../citia-backend/context/US/07.01-registro-hechos.md#frontend-citia-frontend-en-vue)
· por qué, en [ADR-14 §9 y §10](../../../citia-backend/context/Decisions/ADR-14.md). Verificado solo con
respuestas simuladas.

### Asistencia sobre una pendiente y la hora de inicio en el backend

El backend (US-07.01) permite **Asistió** y **No asistió** también desde `pendiente` (asistio directo;
No asistió → `ghosting`, *"Sin respuesta"*) y **solo desde la hora de inicio**: antes no las declara en
`accionesPermitidas` y responde 409 si se llaman. La sección queda así:

| La cita está… | `accionesPermitidas` trae | La sección muestra |
|---------------|---------------------------|--------------------|
| `pendiente`, todavía no empieza | `confirmar` | **Confirmación** — *"¿El paciente confirmó que vendrá? Márcala como confirmada."* + **Confirmar cita** |
| `pendiente` y **ya empezó** | `confirmar`, `asistencia`, `inasistencia` | **Asistencia** — *"La cita ya empezó y el paciente no la confirmó. ¿Vino?"* + **Asistió** / **No asistió**. **Sin Confirmar** |
| `confirmada`, todavía no empieza | nada de esto | **Asistencia** — *"Podrás registrar la asistencia cuando llegue la hora de la cita (HH:mm)."*, sin botones |
| `confirmada`, ya empezó | `asistencia`, `inasistencia` | **Asistencia** — *"¿El paciente vino a la cita?"* + **Asistió** / **No asistió** |
| vigente, ya es la hora en el equipo pero el backend aún no declara la asistencia | nada de esto | *"La cita ya empezó. En un momento podrás registrar si el paciente vino."*; tras el reintento: *"La cita ya empezó, pero todavía no se puede registrar la asistencia. Revisa que la hora de tu equipo esté bien."* + **Volver a intentar** |
| terminal | nada | Badge y nota; `ghosting`: *"El paciente no confirmó ni asistió. Ya no admite cambios."* |

- **Los botones los declara el backend.** Asistió / No asistió aparecen si vienen en
  `accionesPermitidas` (el backend ya exige la hora). "Ya empezó" es el reloj del equipo **o** el backend:
  si el reloj del equipo va atrasado, gana el servidor.
- **Recarga a la hora de inicio:** cuando `useYaEmpezo` pasa a "ya empezó" con el voucher abierto (y el
  detalle de esa cita ya cargado), se vuelve a pedir `GET /citas/:id`. Si el detalle sigue sin traer la
  asistencia (reloj del equipo adelantado), **un** reintento a los 30 s por apertura; si tampoco, el
  texto de arriba y *Volver a intentar*. El temporizador se cancela al cerrar el voucher.
- **Confirmar no se ofrece sobre una pendiente que ya empezó** (ADR-14 §9: no fabricar una confirmación
  que no hubo). Es presentación: el backend lo sigue aceptando (pregunta abierta 1 del plan).
- **No asistió sobre una pendiente** avisa en la confirmación: *"El paciente no confirmó la cita y no
  llegó: queda cerrada como «Sin respuesta» y ya no admite cambios. Esta acción no se puede deshacer."*
  El éxito sale del `estado` de la respuesta: *"Inasistencia registrada: el paciente no confirmó ni
  asistió. La cita quedó como «Sin respuesta»."*
- **409 `CitaAunNoComienzaError`** (la cita todavía no comienza para el servidor): su mensaje se muestra
  tal cual — *"La cita todavía no comienza: la asistencia y la inasistencia se marcan desde su hora de
  inicio"* — y el detalle se recarga, como en todo 409. Se reconoce por el comienzo del texto
  (`model/mensajeDeError.ts`); los demás 409 siguen con el mensaje genérico.
- **Quién confirmó:** con `pendiente → asistio`, el backend ya no cuenta una confirmación anterior a un
  reagendamiento (decisión H9): el voucher sigue mostrando lo que mande `confirmadaPor`.

### "¿Quién lo pidió?" al cancelar y reagendar

| Qué | Cómo |
|-----|------|
| Pregunta | *"¿Quién lo pidió?"* con dos opciones: **El paciente** → `paciente`, **Decisión mía** → `profesional` |
| Al abrir | **ninguna marcada** (un valor por defecto terminaría guardado sin que nadie lo eligiera) |
| Obligatoria | mientras no hay respuesta se ve *"Indica quién pidió el cambio."* junto a la pregunta y el botón de enviar queda deshabilitado; el caso de uso tampoco envía sin ella |
| Envío | `pedidoPor` en el cuerpo de `…/cancelar` y `…/reagendar` |
| Dónde | `ui/QuienLoPidio.vue` (nuevo: radios nativos con el aspecto de los chips de Recordatorios), `ui/CancelarCitaConfirm.vue`, `ui/ReagendarCitaForm.vue`, `model/useCancelarCita.ts`, `model/useReagendarCita.ts`, `PedidoPor` en `model/types.ts` |

En reagendar, la pregunta se valida aparte de la fecha y la hora (`errorPedidoPor`): la vista sigue
mostrando *"Nueva hora: …"* mientras falta la respuesta. El dato no se muestra en ninguna pantalla
(decisión H11): solo se guarda para la calificación de US-07.02.

### Copy nuevo

| Texto | Por qué importa |
|-------|-----------------|
| *"La cita ya empezó y el paciente no la confirmó. ¿Vino?"* | Reemplaza *"…Para registrar si el paciente asistió, primero confírmala."*: ya no hace falta confirmar antes |
| *"…queda cerrada como «Sin respuesta»…"* (No asistió sobre una pendiente) | El estado de destino no es «No asistió»; sin el aviso, el badge sorprende |
| *"El paciente no confirmó ni asistió."* (nota de `ghosting`) | Antes decía *"El paciente no confirmó esta cita."*, que ya no alcanza: ahora también lo marca el profesional |
| *"Indica quién pidió el cambio."* | La pregunta es obligatoria |

## Pendientes

- **Prueba manual contra el backend real** (crear, cancelar, reagendar dentro de hoy y a otro día,
  forzar un 409 con dos pestañas; en la Fase 2, además: recordatorios tras crear/reagendar/cancelar y
  agregar el correo a un paciente que no lo tiene; en el lote 2: confirmar → asistió / no asistió,
  una pendiente ya pasada, y un 409 confirmando la misma cita desde dos pestañas; con el bloqueo por
  hora: dejar abierto el voucher de una confirmada que empieza en un par de minutos y ver aparecer los
  botones contra el backend real).
- **US-07.01, en staging** (pasos 2 y 3 de la
  [verificación manual](../../../citia-backend/context/US/07.01-registro-hechos.md#verificación-manual-mínima)):
  una pendiente pasada ofrece Asistió / No asistió sin Confirmar y No asistió la deja *"Sin respuesta"*;
  una cita futura no ofrece ninguna de las dos; cancelar y reagendar no se envían sin *"¿Quién lo
  pidió?"*. **Se despliega después del backend:** contra uno anterior, `pedidoPor` se descarta en
  silencio y una confirmada futura volvería a mostrar Asistió / No asistió.

## Deudas técnicas asociadas

- [DTF-06](../Deudas/DTF-06.md) — límite del motivo copiado del DTO; desde la Fase 2 también el largo
  del correo (254) y el margen de 30 min de los recordatorios.
- [DTF-07](../Deudas/DTF-07.md) — la fecha/hora elegida se interpretaba en la zona del navegador, y las
  horas de los recordatorios (Fase 2) se mostraban en esa zona. **Cerrada** el 2026-10-06: zona fija de
  Chile para elegir, mostrar y prellenar reagendar.
- `DT-12` / `DT-13` (backend) — solapamiento y horas pasadas aceptadas en silencio.
- `DT-29` (backend) — `GET :id`, `reagendar` y `cancelar` ya se consumen.
