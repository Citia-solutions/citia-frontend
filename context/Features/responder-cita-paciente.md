# Responder la cita — página del paciente (`/cita`) y su reflejo en el panel

**Estado:** ✅ Implementado (2026-10-14) · ⚠️ verificado solo con respuestas simuladas: el backend de la
Fase 3 se implementa en paralelo contra el mismo contrato
**Rama:** `feature/fase3-respuesta-paciente` (sin commit)
**Origen:** Fase 3 — US-04 (respuesta del paciente) + subtarea **US-02.07** de US-02, versión v1
([plan](../us/02.07-paciente-reagenda-cancela.md))
**Backend:** [`fase-3-us04-respuesta-paciente.md`](../../../citia-backend/context/Fases/fase-3-us04-respuesta-paciente.md) ·
[US-04](../../../citia-backend/context/US/04-respuesta-paciente.md) ·
[US-02.07](../../../citia-backend/context/US/02.07-paciente-reagenda-cancela.md) ·
[ADR-10](../../../citia-backend/context/Decisions/ADR-10.md)
**Feature nuevo:** `src/features/responder-cita/` · **Página:** `src/pages/cita-paciente/` · **Ruta:** `/cita`
**Cambios en:** `features/gestionar-cita` (voucher), `features/bandeja-solicitudes`,
`entities/appointment`, `entities/solicitud`, `public/_headers`

---

## Qué hace

Cada recordatorio por correo lleva **un solo botón** — *"Ver o responder mi hora"* — que abre
`${FRONTEND_URL}/cita#<token>`. Ahí el paciente, **sin cuenta**, ve su hora y puede:

- **Confirmar mi hora** — un clic.
- **Cancelar mi hora** — con un paso de confirmación y motivo opcional (≤ 300).
- **Pedir otra hora** — un formulario con lo que le acomoda (obligatorio, ≤ 300) y un comentario
  opcional (≤ 300), con el aviso de no escribir información médica. **No mueve la cita**: crea una
  solicitud de tipo `reagendamiento` en la bandeja del profesional.

Qué botones aparecen lo decide `accionesPermitidas` del backend. En el panel, el profesional ve el
resultado: quién confirmó o canceló (voucher), la nota *"El paciente pidió otra hora"* (voucher) y la
solicitud marcada *"Pide otra hora"* (bandeja), que al aceptarla **mueve** la cita original.

---

## La página `/cita`

### El token: en el fragmento, en memoria, fuera de la URL

| Regla | Cómo se cumple |
|-------|----------------|
| El token es una **credencial** y no va en el path ni en la query | Ruta `/cita` + fragmento `#<token>`: el navegador no lo manda al servidor que sirve el front ni lo pone en el `Referer` |
| Se **borra de la URL** al abrir | `CitaPacientePage` lee `route.hash` y llama `router.replace({ …, hash: '' })`. vue-router hace el `history.replaceState` y además actualiza su estado interno; un `replaceState` a mano lo dejaría recordando `#<token>` y lo volvería a escribir en el historial en la siguiente navegación |
| Vive **solo en memoria** | Se pasa como prop a `RespuestaCita` y queda en el closure de `useRespuestaCita`. Nada en `localStorage`, `sessionStorage` ni Pinia. **Consecuencia:** recargar la página da "enlace no válido" (la pantalla lo explica: *"Ábrelo de nuevo desde el último correo…"*) |
| Viaja a la API **solo en la cabecera** `X-Enlace-Cita` | `features/responder-cita/api/respuestaCitaApi.ts` |
| Sin token, **no se llama a la API** | `tokenDesdeFragmento` devuelve null si no hay fragmento o si tiene caracteres fuera de base64url (`fetch` rechazaría la cabecera y el paciente vería "error de conexión"). El largo exacto (43) no se valida: es regla del backend |
| **Fragmento nuevo con la página abierta** (corregido el 2026-10-15) | El paciente toca el enlace de otro correo y el navegador reutiliza la pestaña: es una navegación del **mismo documento** (solo cambia el fragmento), vue-router no vuelve a montar la página y antes se seguía mostrando —y respondiendo— la cita del token anterior, con el fragmento nuevo visible en la URL. Ahora `CitaPacientePage` vigila `route.hash`: cada fragmento no vacío se trata igual que al abrir (se lee, se borra de la URL con `router.replace`) y `RespuestaCita` se vuelve a montar desde cero con `:key`, así se descarta todo lo de la cita anterior (formulario abierto, lo escrito, avisos) y solo se hace el **GET** del nuevo token, nunca un POST. Un fragmento inválido lleva a "enlace no válido" sin llamar a la API |

### Llamadas

Todas con `{ auth: false }` (la sesión del profesional, si el navegador la tiene, no viaja; un 401 no la
cierra), `cache: 'no-store'` y `referrerPolicy: 'no-referrer'`.

| Llamada | Cuerpo | Éxito | Cuándo |
|---------|--------|-------|--------|
| `GET /publico/cita` | — | 200 `VistaCitaPacienteDto` | al abrir y en "Reintentar" — **lo único que pasa al abrir** |
| `POST /publico/cita/confirmar` | — | 200 vista | clic en *Confirmar mi hora* |
| `POST /publico/cita/cancelar` | `{ motivo? }` | 200 vista (`cancelada`, sin acciones) | clic en *Sí, cancelar mi hora* |
| `POST /publico/cita/otra-hora` | `{ preferencia, motivo? }` | 201 vista (con `solicitudOtraHora`) | clic en *Enviar pedido* |

```ts
VistaCitaPacienteDto = {
  inicio: string            // ISO UTC → se muestra en hora de Chile (shared/lib/fecha.ts)
  zonaHoraria: string       // APP_TZ; el front no la usa: formatea con ZONA_HORARIA, su espejo
  duracionMin: number
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'asistio' | 'no_asistio' | 'ghosting'
  profesional: string
  organizacion: string
  accionesPermitidas: Array<'confirmar' | 'cancelar' | 'pedirOtraHora'>
  solicitudOtraHora: { preferencia: string; solicitadaEn: string } | null
}
```

`motivo` se omite del cuerpo si va vacío; los textos viajan sin espacios sobrantes. Cada acción
exitosa **reemplaza la vista con la que devuelve** (no se vuelve a pedir).

### Pantallas y errores

| Caso | Qué ve el paciente |
|------|--------------------|
| Cargando | Esqueleto de la tarjeta |
| Sin token, o **404** (al abrir o en cualquier acción) | **Una sola pantalla:** *"Este enlace no es válido o ya venció"* + *"Ábrelo de nuevo desde el último correo de recordatorio que recibiste. Si necesitas hacer un cambio en tu hora, contacta directamente a tu profesional."* No distingue inválido, invalidado, cita terminal ni pasada (el backend responde el mismo 404) |
| **409** en una acción | Vuelve al resumen, **recarga la vista** (GET) y muestra *"Esta acción ya no está disponible."*; si la recarga da 404, pasa a "enlace no válido" |
| **429** | *"Demasiados intentos, prueba en unos minutos."* — en la pantalla actual, conservando lo escrito (al abrir: pantalla de error con *Reintentar*) |
| Red caída | *"No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."* (ídem) |
| 400 | *"No pudimos procesar tu respuesta. Revisa lo que escribiste…"* (no debería ocurrir) |
| Confirmó | *"¡Listo! Confirmaste tu hora. Te esperamos."* |
| Canceló | *"Cancelaste tu hora."* + *"Este enlace ya no sirve para hacer más cambios. Si necesitas una hora nueva, contacta a tu profesional."* (es la única vez que verá la cita cancelada: un GET posterior ya es 404) |
| Pidió otra hora | *"Recibimos tu pedido de otra hora."* y el bloque de abajo |
| Hay `solicitudOtraHora` (y la hora sigue vigente) | *"**Pediste otra hora:** <preferencia>. El profesional se pondrá en contacto contigo."* + *"Mientras tanto, tu hora actual se mantiene."* Solo con la hora vigente: tras cancelar, la respuesta puede traer aún la solicitud (el backend la descarta aparte) y "te contactará" sería falso |

### Lo que se muestra (y lo que no)

Fecha con año (*"Martes, 20 de octubre de 2026"*), rango y duración (*"10:00 – 10:50 · 50 min (hora de
Chile)"*), profesional, organización y el estado **en el idioma del paciente**: `pendiente` →
*Por confirmar*, `confirmada` → *Confirmada*, `cancelada` → *Cancelada* (los terminales, que con un
enlace válido no se ven, caen en *Atendida* / *Cerrada*; nunca "ghosting"). **Nunca** el nombre del
paciente, su RUT, su contacto ni el tipo de consulta (decisión S2: un enlace se reenvía).

### Copy que carga significado

| Texto | Por qué |
|-------|---------|
| *"Pedir otra hora"*, nunca "Reagendar" | El paciente **pide**, no reserva (ADR-09, B1). El sistema no conoce la disponibilidad del profesional |
| *"Tu hora actual es el … y se mantiene hasta que el profesional se ponga en contacto contigo."* | Pedir otra hora no libera ni mueve la cita (decisión R1) |
| *"Por tu privacidad, no escribas información médica (síntomas, diagnósticos ni medicamentos)…"* | La preferencia y el motivo llegan como texto libre a la bandeja |
| *"Tu hora quedará libre y este enlace ya no servirá para hacer cambios. Esta acción no se puede deshacer."* | Cancelar es terminal y deja el enlace sin efecto |
| *"Este enlace es personal: no lo reenvíes."* (pie) | El enlace es la credencial |
| Nada de *"le avisamos a tu profesional"* | Citia no notifica al profesional; lo ve en su agenda y en el voucher |

### Diseño

Móvil primero (el enlace llega por correo): fondo azul de marca como `/agendar-cita`, logo, y una
tarjeta blanca de ancho completo con 1 rem de margen; desde 640 px la tarjeta se centra (máx. 480 px).
Botones apilados a lo ancho: *Confirmar mi hora* (principal), *Pedir otra hora*, *Cancelar mi hora*
(rojo). Los campos usan 16 px para que Safari de iOS no haga zoom. Al cambiar de pantalla por una
acción, el foco va al título de la nueva; los avisos son `role="status"` / `role="alert"`.

**Sin recursos de terceros:** ni fuentes externas, ni analítica, ni imágenes; los íconos son SVG en
línea.

### Netlify: `public/_headers`

```
/cita
  Referrer-Policy: no-referrer
  X-Robots-Tag: noindex, nofollow
```

`public/_redirects` (`/*  /index.html  200`) ya existía y sirve `/cita` como cualquier ruta de la SPA.
⚠️ **Verificar en staging** con `curl -I https://staging.citiahealth.cl/cita` que Netlify aplica las
cabeceras de `/cita` a una ruta reescrita a `index.html`. Si no, ampliar la regla a `/*` (con
`no-referrer` global, ojo: los POST *same-origin* mandarían `Origin: null`; hoy la API es de otro
origen, así que no afecta).

---

## Voucher (`features/gestionar-cita`)

| Qué | Detalle |
|-----|---------|
| **Quién confirmó / canceló** | Bajo el badge: *"Confirmada por el paciente"* / *"Confirmada por ti"* (en `confirmada`, y en `asistio` / `no_asistio`, que se cerraron tras confirmarse) y *"Cancelada por el paciente"* (en `cancelada`). Sale de `confirmadaPor` / `canceladaPor` de `GET /citas/:id` (`'paciente' \| 'profesional' \| 'sistema' \| null`), traducidos en `entities/appointment` a `confirmedBy` / `cancelledBy`. Si el campo no viene (backend anterior) o es `sistema`, no se dice nada; una cancelación del profesional tampoco lleva texto (la nota "Esta cita fue cancelada" basta) |
| **"El paciente pidió otra hora: <preferencia>"** | Nota azul arriba del detalle con el enlace *"Responder en Solicitudes"* (`/solicitudes`). `GET /solicitudes?citaOrigenId=<id>&estado=recibida` vía `getSolicitudOtraHoraAbierta` de `entities/solicitud`, que además filtra en el front por `tipo` y `citaOrigenId` (si un backend viejo ignorara el filtro, no se atribuye a esta cita la solicitud de otro). Se pide al abrir y tras cada acción; un fallo no muestra error (la nota no aparece). No se muestra en una cita terminal. Si el profesional reagenda desde el voucher, el backend da la solicitud por atendida (`aceptada`) y la nota desaparece al recargarla |
| **"Invalidar enlace del paciente"** | Sección *Enlace del paciente* (solo con la cita vigente, `pendiente`/`confirmada`, según el detalle fresco) → vista de confirmación `InvalidarEnlaceConfirm.vue`: *"…el enlace de los correos ya enviados dejará de funcionar: quien lo abra verá que no es válido."* · *"La cita no cambia, y si quedan recordatorios por enviar, llevarán un enlace nuevo."* → `POST /citas/:id/enlace/invalidar` (204, idempotente). Éxito: *"Enlace del paciente invalidado: el de los correos ya enviados dejó de funcionar."*. 404 vuelve al detalle con el error y recarga; 401/red quedan en la vista. No está en `accionesPermitidas`: la ruta no depende del estado |

## Bandeja (`features/bandeja-solicitudes`)

| Qué | Detalle |
|-----|---------|
| **Tipos nuevos** | `SolicitudBandejaDto` suma `tipo` (`nueva` \| `reagendamiento`, ausente → `nueva`), `citaOrigenId` y `citaOrigen: { inicio, duracionMin, estado } \| null`. `rut` y `correo` pueden ser null (la de otra hora copia la ficha del paciente, y el alta manual permite pacientes sin RUT ni correo): se muestran *"Sin RUT"* / *"Sin correo"*. `motivo` llega `''` si no hay: no se muestra la fila |
| **Etiqueta "Pide otra hora"** | Badge junto al nombre + *"Su hora actual: Martes, 20 de octubre, 10:00 · 50 min · Confirmada"* (*"Su cita:"* en las resueltas). La preferencia se rotula *"Pide"* |
| **Aceptar una de otra hora** | El modal pasa a *"Aceptar otra hora"* — *"Se moverá la cita de X."*, muestra la hora actual y lo que pide el paciente, y pide **solo fecha y hora** (sin duración ni tipo). Envía `{ inicio }`; para una `nueva` sigue `{ inicio, duracionMin, tipoConsulta }`. Valida futuro, fin de jornada con la duración de la cita original y que no sea la misma hora. Botón *"Mover la cita"*. Éxito: *"Cita de X movida al …, pendiente de confirmación."* 409: *"No se pudo mover la cita: la solicitud ya fue resuelta o la cita original ya no está vigente. Actualizamos la bandeja."* |
| **Rechazar una de otra hora** | *"¿Rechazar el pedido de otra hora de X?"* · *"Su cita se mantiene a la hora que tiene hoy…"* (el paciente no recibe aviso, decisión R3) |
| **Estado `descartada`** | Pestaña *Descartadas* (2 × 2 en pantallas < 420 px) y en el historial *"Descartada: <fecha> · La cita original se canceló o se cerró antes de que alguien respondiera."* La pone el sistema (suscriptor del outbox) |
| **Modal: identificación** | Bloque *Paciente* con nombre y *"RUT … · correo"* o *"Sin RUT · Sin correo"* |

La píldora del sidebar cuenta todas las `recibida`, de ambos tipos (las dos esperan respuesta).

---

## Código

```
src/pages/cita-paciente/ui/CitaPacientePage.vue   # lee y borra el fragmento; compone RespuestaCita
src/features/responder-cita/
├── api/respuestaCitaApi.ts      # GET/POST /publico/cita*, X-Enlace-Cita, auth:false, no-store, no-referrer
├── model/
│   ├── types.ts                 # VistaCitaPacienteDto, AccionPaciente, cuerpos
│   ├── tokenEnlace.ts           # tokenDesdeFragmento (charset base64url)
│   ├── useRespuestaCita.ts      # estados (cargando/lista/invalido/error), pantallas, acciones, 404/409
│   ├── mensajeDeError.ts        # 429, red, 400, 5xx
│   ├── formularios.ts           # LIMITE_TEXTO = 300 (DTF-06), validaciones
│   └── presentacion.ts          # estado en idioma del paciente, fecha con año, rango
└── ui/  RespuestaCita.vue · ResumenHora.vue · CancelarHoraForm.vue · PedirOtraHoraForm.vue
src/features/gestionar-cita/     # + useSolicitudOtraHora, useInvalidarEnlace, InvalidarEnlaceConfirm.vue
src/features/bandeja-solicitudes/ # + AceptarReagendamientoRequest, modal y lista por tipo, pestaña Descartadas
src/entities/appointment/        # + AppointmentActor, confirmedBy / cancelledBy
src/entities/solicitud/          # + TipoSolicitud, CitaOrigen, 'descartada', getSolicitudes(estado, { citaOrigenId }), getSolicitudOtraHoraAbierta
public/_headers                  # nuevo
```

`responder-cita` **no reutiliza** `gestionar-cita`: mismo verbo, otro actor, otras rutas, otras reglas.

---

## Verificación

- `npm run build` (incluye `vue-tsc`) sin errores. No hay ESLint en el proyecto.
- En el navegador con `fetch` simulado, en 375 px y en escritorio: `/cita` sin fragmento (pantalla de
  enlace no válido, **cero** llamadas); con token (URL y `history.state` quedan en `/cita`, un solo GET
  con `X-Enlace-Cita` y sin `Authorization`, ningún POST al abrir); confirmar; pedir otra hora (vacío
  no envía; `motivo` vacío se omite); cancelar con 429 y luego con éxito; 409 (recarga + aviso); 404 en
  una acción; red caída al abrir + *Reintentar*; 429 al abrir; fragmento con caracteres raros (sin
  llamadas). Panel: bandeja con *Pide otra hora*, *Sin RUT* / *Sin correo*, aceptar con `{ inicio }`,
  pestaña *Descartadas*; voucher con la nota, *Confirmada por el paciente*, *Cancelada por el paciente*
  e invalidar enlace.
- **Fragmento nuevo en la misma pestaña** (2026-10-15, con `fetch` simulado que responde una cita
  distinta según `X-Enlace-Cita`): abierta la cita A con el formulario de otra hora a medio escribir,
  `location.href = '/cita#<B>'` (mismo documento, sin recarga) → un GET con B, URL y `history.state` en
  `/cita`, formulario descartado, ningún POST; *Pedir otra hora* después → POST con B;
  `location.hash = '<A>'` → GET con A y sin el aviso de éxito de B; `location.hash` inválido → "enlace no
  válido" sin llamadas; `history.back()` → ninguna entrada trae un token ni dispara llamadas. No hay
  suite de tests en el proyecto donde dejarlo como prueba automática.

## Pendientes

| Qué | Nota |
|-----|------|
| **Prueba contra el backend real** | Con un token emitido por un recordatorio real: abrir, confirmar, pedir otra hora, cancelar; invalidar desde el voucher y reabrir el correo (404); aceptar una de otra hora y ver la cita movida; 429 forzado |
| Cabeceras de Netlify en `/cita` | Verificar en staging (ver arriba) |
| Selector de preferencia | El plan proponía extraer el calendario de `HorarioStep` a `shared/ui`; la v1 usa **texto libre** (el contrato pide `preferencia: string`). La bandeja la muestra tal cual; `sugerirInicio` casi nunca podrá precargarla |
| Avisar al paciente al aceptar o rechazar | Fuera de la v1 (R3): el paciente se entera por el profesional o por los recordatorios de la nueva hora |

## Deudas técnicas asociadas

- [DTF-06](../Deudas/DTF-06.md) — `LIMITE_TEXTO` (300) copia el DTO del portal.
- `DT-16` (backend) — consentimiento: no se consulta antes de enviar el recordatorio con el enlace.
- `DT-18` (backend) — límite de tasa: la Fase 3 lo agrega en las rutas del enlace; el front maneja el 429.
