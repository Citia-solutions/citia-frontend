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

---

## Qué hace

Desde "Citas de hoy", **"Ver cita"** abre un modal tipo voucher con:

- **Cita:** fecha, hora, duración, tipo de consulta y estado (mismo badge que la lista).
- **Paciente:** nombre, RUT (formateado), teléfono y correo — con **Editar** (Fase 2).
- **Recordatorios por correo** (Fase 2): estado de cada recordatorio — ver
  [recordatorios](recordatorios.md#estado-en-el-voucher).
- **Confirmación / Asistencia** (2026-10-05): **Confirmar cita**, **Asistió** y **No asistió**, según
  `accionesPermitidas`.
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
| `PATCH /citas/:id/confirmar` (sin cuerpo) | pendiente → confirmada (2026-10-05) |
| `PATCH /citas/:id/asistencia` (sin cuerpo) | confirmada → asistio, terminal (2026-10-05) |
| `PATCH /citas/:id/inasistencia` (sin cuerpo) | confirmada → no_asistio, terminal (2026-10-05) |

`toAppointmentDetail()` en `entities/appointment/api/appointmentApi.ts` traduce el detalle al modelo
del front. `motivo` **se omite** del cuerpo cuando va vacío.

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
| Historial (`GET /citas/:id/historial`) | Segunda entrega, según el plan. |
| ~~Confirmar, asistencia, inasistencia~~ | ✅ Hechos el 2026-10-05 (ver abajo). |
| Editar (duración, tipo) | El backend lo anuncia en `accionesPermitidas`; no se muestra todavía. |
| ~~Aviso de solapamiento~~ | ✅ Hecho en el cierre de Fase 1 (ADR-11): tras reagendar, el voucher lista las citas con las que choca — ver [agenda-profesional](agenda-profesional.md#aviso-de-solapamiento-adr-11). |
| "Generar enlace para el paciente" | Depende de US-02.07 y [ADR-10](../../../citia-backend/context/Decisions/ADR-10.md) (propuesto). |

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
| *"Sus recordatorios pendientes se anulan. Citia no le avisa al paciente de la cancelación."* (cancelar) | Con recordatorios automáticos es fácil suponer que Citia también avisa las cancelaciones. No lo hace. |

`PATCH /pacientes/:id` vive en este feature porque el voucher es el único lugar del front donde se
edita un paciente (no hay ficha de pacientes todavía). Si aparece una, la llamada pasa a una entidad
`paciente`.

## Confirmación y asistencia (2026-10-05)

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
  | Confirmar | *"Úsalo cuando el paciente te confirme que vendrá (por teléfono, en persona o por correo). Citia no le envía ningún aviso."* · *"Sus recordatorios siguen programados igual."* |
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
- ⚠️ **Es un bloqueo solo del frontend.** El backend acepta `PATCH /citas/:id/asistencia` e
  `/inasistencia` antes de la hora (las guardas de `Cita` solo miran el estado) y `accionesPermitidas`
  las declara igual. Otro cliente, o una llamada directa a la API, puede marcarlas antes.
- El desbloqueo ocurre en el instante `inicio` según el reloj del navegador (un instante: no depende de
  su zona); el texto muestra `hora`, de la clínica. Desde el 2026-10-06 todo lo demás del voucher (fecha
  larga, hora de término, recordatorios, "Ya no aparece en tu lista de hoy") también va en hora de Chile
  ([DTF-07](../Deudas/DTF-07.md), cerrada).

## Pendientes

- **Prueba manual contra el backend real** (crear, cancelar, reagendar dentro de hoy y a otro día,
  forzar un 409 con dos pestañas; en la Fase 2, además: recordatorios tras crear/reagendar/cancelar y
  agregar el correo a un paciente que no lo tiene; en el lote 2: confirmar → asistió / no asistió,
  una pendiente ya pasada, y un 409 confirmando la misma cita desde dos pestañas; con el bloqueo por
  hora: dejar abierto el voucher de una confirmada que empieza en un par de minutos y ver aparecer los
  botones contra el backend real).

## Deudas técnicas asociadas

- [DTF-06](../Deudas/DTF-06.md) — límite del motivo copiado del DTO; desde la Fase 2 también el largo
  del correo (254) y el margen de 30 min de los recordatorios.
- [DTF-07](../Deudas/DTF-07.md) — la fecha/hora elegida se interpretaba en la zona del navegador, y las
  horas de los recordatorios (Fase 2) se mostraban en esa zona. **Cerrada** el 2026-10-06: zona fija de
  Chile para elegir, mostrar y prellenar reagendar.
- `DT-12` / `DT-13` (backend) — solapamiento y horas pasadas aceptadas en silencio.
- `DT-29` (backend) — `GET :id`, `reagendar` y `cancelar` ya se consumen.
