# Recordatorios por correo — configuración y estado en el voucher

**Estado:** ✅ Implementado (2026-10-04) · ⚠️ verificado solo con respuestas simuladas (sin prueba contra el backend real)
**Rama:** `feature/fase2-recordatorios` · PR [Citia-solutions/citia-frontend#2](https://github.com/Citia-solutions/citia-frontend/pull/2)
**Origen:** Fase 2 — **US-03** (RF-06). Diseño en
[ADR-13](../../../citia-backend/context/Decisions/ADR-13.md) del backend; plan en
[`US/03-recordatorios.md`](../../../citia-backend/context/US/03-recordatorios.md)
**Backend:** módulo `recordatorio` (`citia-backend/src/modules/recordatorio/CLAUDE.md`)
**Código:** `src/features/configurar-recordatorios/` · `src/entities/recordatorio/` ·
sección del voucher en `src/features/gestionar-cita/` · **Ruta:** `/recordatorios`

---

## Qué hace

Dos piezas de interfaz sobre el mismo módulo del backend:

| Pieza | Dónde | Qué ve el profesional |
|-------|-------|-----------------------|
| **Configuración** | `/recordatorios` (entrada **Recordatorios** del sidebar, bajo Solicitudes) | Activar/desactivar, de 1 a 3 momentos de envío, teléfono y correo de contacto opcionales |
| **Estado por cita** | Voucher de la cita ([gestionar-cita](gestionar-cita.md)), sección *Recordatorios por correo* | Cada recordatorio con su momento, estado (badge) y motivo cuando no salió |

El correo del paciente pasó a ser **obligatorio** al crear una cita: ver [crear-cita](crear-cita.md).

---

## Contrato con el backend

| Llamada | Uso |
|---------|-----|
| `GET /recordatorios/configuracion` → `{ activo, canal, antelacionesMin (desc), telefonoContacto, correoRespuesta, predeterminada }` | Cargar la pantalla |
| `PUT /recordatorios/configuracion` — `{ activo, antelacionesMin, telefonoContacto, correoRespuesta }` | Guardar (**reemplazo completo**) |
| `GET /citas/:citaId/recordatorios` → `RecordatorioCitaDto[]` ordenado por `programadoPara` | Sección del voucher |
| `PATCH /pacientes/:id` — `{ telefono?, correo? }` | Vista "Contacto" del voucher (ver abajo) |

- La configuración es **siempre la del usuario del token**: no viaja `tenantId` ni `usuarioId`.
- **PUT = reemplazo completo:** el front manda siempre los cuatro campos; un texto vacío viaja como
  `null` (sin teléfono / sin `Reply-To`). Nunca se omite un campo "porque no cambió".
- `toRecordatorio()` (`entities/recordatorio/api/recordatorioApi.ts`) es el único lugar que conoce los
  nombres del DTO.

---

## Pantalla de configuración

- **Predeterminada:** mientras el profesional nunca guardó, el backend responde la del entorno
  (activa, 24 h y 2 h) con `predeterminada: true`, y la pantalla lo dice en un aviso azul. Desaparece
  al guardar.
- **Momentos:** casillas tipo *chip* — 1 semana, 3 días, 24 h, 2 h, 1 h y 30 min
  (`ANTELACIONES_SUGERIDAS`). Con 3 elegidos, el resto se deshabilita ("Para elegir otro, quita uno").
  Si la configuración guardada trae otro valor válido (p. ej. 90 → "1 h 30 min"), se agrega como
  opción para no perderlo al guardar.
- **Horas sin envío:** aviso fijo *"No se envían correos entre las 21:00 y las 08:00 (hora de la
  clínica)…"*. Es informativo (`HORAS_SIN_ENVIO`); lo aplica el backend.
- **Contacto (opcional):** teléfono (≤ 30) y correo para respuestas (`Reply-To`, ≤ 254). La ayuda del
  correo cambia según esté lleno o vacío.
- **Guardar:** solo con cambios (`hayCambios` compara contra lo último guardado). "Descartar cambios"
  vuelve a eso. Salir de la ruta con cambios pendientes pide confirmación (`onBeforeRouteLeave`).
- **Estados:** esqueleto en la primera carga, error con "Reintentar", botón con spinner al guardar,
  mensaje de éxito o error bajo el formulario. Un 400 que nombra un campo (`antelacionesMin`,
  `telefonoContacto`, `correoRespuesta`, tanto del `ValidationPipe` como del dominio) se marca en ese
  campo.

### Copy que carga significado

| Texto | Por qué importa |
|-------|-----------------|
| *"Configuración guardada. Tus citas ya agendadas se actualizan en unos segundos."* | El backend reprograma las citas futuras **de forma asíncrona** (outbox, ~5 s). Si el voucher se abre enseguida puede mostrar lo anterior. |
| *"Al guardar, se anulan los recordatorios pendientes de tus próximas citas."* (al apagar) | Apagar no es "pausar los nuevos": anula (`cancelado`, `desactivado`) los ya programados. |
| *"Si lo dejas vacío, el recordatorio dirá que ese correo no recibe respuestas."* | Decisión E2 de ADR-13: sin `Reply-To` la respuesta del paciente se perdería; el correo lo advierte. |
| *"…se adelanta para que salga antes de las 21:00: nunca llega más cerca de la cita de lo que elegiste."* | ADR-13 §5.c: el ajuste por silencio siempre adelanta, nunca atrasa. |
| *"No incluye el tipo de consulta ni datos del paciente."* | ADR-13 §12: privacidad del contenido. |

---

## Estado en el voucher

Sección **Recordatorios por correo**, bajo *Contacto*. Componente `RecordatoriosCita.vue`
(presentacional) + composable `useRecordatoriosCita.ts` (carga y reintentos), ambos en
`features/gestionar-cita/`. Etiquetas, colores y motivos viven en `entities/recordatorio/model/presentacion.ts`.

Cada fila: **momento** (`describirAntelacion`: "24 h antes", "3 días antes", "1 h 30 min antes"),
**badge de estado**, una **línea de tiempo** según el estado y el **motivo** si no salió.

| Estado | Etiqueta | Badge | Línea de tiempo |
|--------|----------|-------|-----------------|
| `programado` | Programado | info (azul) | *Se enviará:* `proximoIntentoEn` ?? `programadoPara` |
| `enviado` | Enviado | success | *Enviado:* `enviadoEn` |
| `entregado` | Entregado | success | *Entregado:* `entregadoEn` |
| `fallido` | Falló | danger | *Enviado:* (si alcanzó a salir) o *Estaba programado para:* |
| `cancelado` | Cancelado | neutral | *Estaba programado para:* |
| `omitido` | Omitido | warning | *Estaba programado para:* |

Ámbar para `omitido` porque suele tener arreglo (p. ej. agregar el correo); gris para `cancelado`
porque no es un fallo (la cita cambió). Horas con `formatearMomentoCorto` (`mar, 14 oct · 10:30`).

### Motivos en lenguaje humano

| Código | Texto |
|--------|-------|
| `cita_terminal` | La cita ya no está vigente (se canceló o ya se cerró). |
| `reprogramado` | Se reemplazó por otro: la cita cambió de hora o cambiaste tu configuración. |
| `desactivado` | Desactivaste los recordatorios. |
| `creada_tarde` | La cita se agendó cuando este momento ya había pasado. |
| `fusionado` | Quedaba muy cerca de otro recordatorio de la misma cita; se envía solo uno. |
| `sin_correo` | El paciente no tiene correo registrado. |
| `correo_suprimido` | No se escribe a este correo porque antes rebotó o el paciente lo marcó como spam. |
| `limite_tenant` | Tu organización alcanzó el máximo de recordatorios del día. |
| `sin_consentimiento` | El paciente no autorizó recibir recordatorios. |
| `correo_invalido` | El correo del paciente no es válido o no existe. |
| `rechazado` | El servicio de correo rechazó el envío. |
| `vencido` | No se pudo enviar a tiempo. |
| `cuota_agotada` | Se agotó la cuota diaria de envíos antes de poderlo enviar. |
| `rebote` | El correo rebotó: la casilla del paciente no lo recibió. |

Un estado o motivo que el front no conozca (backend más nuevo) se muestra con un texto genérico, sin
romper la vista.

### Lista vacía o vieja: el backend programa de forma asíncrona

Justo después de **crear o reagendar** la lista puede venir vacía, y después de **reagendar o
cancelar** puede traer todavía los `programado` anteriores (~5 s, outbox). `cargar(citaId, hasta)`
recibe una condición y, mientras la respuesta no la cumple, **vuelve a pedir cada 2,5 s hasta 4 veces**
(~10 s), con el indicador *Programando…* / *Actualizando…*:

| Momento | Condición (`useRecordatoriosCita.ts`) |
|---------|----------------------------------------|
| Abrir el voucher de una cita **vigente y a más de 30 min** | `hayAlguno` — al menos uno |
| Tras **reagendar** | `reprogramados(antes, …)` — ninguno de los `programado` de antes sigue `programado` y, si la nueva hora admite recordatorios, apareció alguno nuevo |
| Tras **cancelar** | `ningunoProgramado` |
| Cita pasada, terminal o a menos de 30 min | sin condición: una sola petición |

Agotados los reintentos se muestra lo último que llegó. Con la lista vacía:

- cita que *debería* tener: *"Esta cita aún no tiene recordatorios. Si la acabas de crear o mover,
  pulsa «Actualizar» en unos segundos; si no, revisa que estén activados en Recordatorios"* (enlace a
  `/recordatorios`: el voucher no sabe si el dueño los apagó);
- si no: *"Esta cita no tiene recordatorios."*

"Actualizar" (a mano) siempre está disponible. Al cerrar el voucher se cancelan los reintentos.

**Reemplazados plegados:** los `cancelado` con motivo `reprogramado` (los de la hora anterior tras
reagendar) se esconden tras *"Ver reemplazados (N)"* para no ensuciar la lista.

### Arreglar el correo desde el voucher

- *Contacto* muestra *"Sin correo: no recibe recordatorios"* cuando el paciente no lo tiene, y un
  botón **Editar**.
- Si el paciente no tiene correo y eso afecta (algún `sin_correo` o alguno `programado`), la sección
  ofrece **Agregar correo**; si alguno falló por `correo_invalido`, `rebote` o `correo_suprimido`,
  **Revisar correo**. La sugerencia desaparece apenas el paciente tiene correo.
- Ambos abren la vista **Contacto** del voucher (`EditarContactoForm.vue`, `PATCH /pacientes/:id`):
  solo viaja lo que cambió; el correo no se puede vaciar. Copy: *"Los recordatorios pendientes saldrán
  al correo nuevo. Los que ya se enviaron o no se enviaron por falta de correo no se reenvían."*
  (`omitido` y `fallido` son finales en el backend).

---

## Cambio del lote 2 de la limpieza (2026-10-05)

`GET /recordatorios/configuracion` y su DTO (`ConfiguracionRecordatoriosDto`) pasaron a
`entities/recordatorio` porque también los lee la tarjeta **Recordatorios** del dashboard
([dashboard-citas-del-dia](dashboard-citas-del-dia.md)). `features/configurar-recordatorios` los
reexporta: la pantalla no cambió. Nuevo en la entidad: `describirAntelaciones([1440, 120])` →
*"24 h y 2 h antes"*.

## Pendientes

| Qué | Nota |
|-----|------|
| **Prueba manual contra el backend real** | Crear una cita y ver *Programando…* → `programado`; reagendar (reemplazados plegados); cancelar (`cita_terminal`); apagar la configuración y ver `desactivado`; paciente sin correo → `sin_correo` → agregar correo. |
| Quién configura | La configuración es **por usuario** y se aplica a las citas de las que es dueño. Los dos roles que existen (`admin` y `profesional`, [DTF-04](../Deudas/DTF-04.md) cerrada: ya no hay `recepcion`) ven la pantalla, porque el front no ramifica por rol; un usuario sin citas propias guardaría una configuración que no afecta a nadie. Decidir si se oculta por rol. |
| RUT existente con otro correo | Al crear con un RUT que ya tiene correo distinto, el backend conserva el guardado y la UI no avisa (la ayuda del RUT lo menciona). Se ve y se corrige en el voucher. |
| Horas sin envío / margen copiados | `HORAS_SIN_ENVIO` (21:00–08:00) y el margen de 30 min de `deberiaTenerRecordatorios` son copias del entorno del backend — [DTF-06](../Deudas/DTF-06.md). |

## Deudas técnicas asociadas

- [DTF-06](../Deudas/DTF-06.md) — límites de la configuración (30–10.080 min, máx. 3, teléfono 30,
  correo 254), horas sin envío y margen de 30 min copiados del backend.
- [DTF-07](../Deudas/DTF-07.md) — las horas de los recordatorios se muestran en la zona del navegador.
- `DT-16` (backend) — el consentimiento no se revisa antes de enviar (`sin_consentimiento` existe pero
  la política está apagada).
