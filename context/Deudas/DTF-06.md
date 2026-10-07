# DTF-06 · Los largos máximos del formulario público copian los del DTO

**Origen:** `src/features/crear-cita/model/flujoCitaModel.ts` (`LIMITES`) y
`citia-backend/src/modules/solicitud/presentation/dto/crear-solicitud.dto.ts`
**Severidad:** 🟡 baja · **Estado:** 🔵 **aceptada a conciencia**

## Qué pasa

Los `@MaxLength` de `CrearSolicitudDto` (nombre 120, teléfono 30, motivo 300) están repetidos a mano
en `LIMITES`. Nada comprueba que sigan iguales.

**Segunda copia (US-02.08, 2026-09-24):** el motivo del voucher (reagendar y cancelar) corta en
**300**, igual que `@MaxLength(300)` en `MotivoCitaDto` y `ReagendarCitaDto` del backend
(`citia-backend/src/modules/cita/presentation/dto/`). Misma regla: si cambia allá, cambia acá.

**Cierre de Fase 1 (2026-09-25):** tres copias más, todas del contrato de
`citia-backend/context/Features/us02-gestion-citas.md` § Cierre de Fase 1:

| Constante (front) | Valor | Espejo de (backend) |
|-------------------|-------|---------------------|
| `MAX_DIAS_RANGO` — `entities/appointment/api/appointmentApi.ts` | 42 | `MAX_DIAS_RANGO` de `CitasService.listarEnRango` |
| `DURACION_MAXIMA_MIN` — `features/bandeja-solicitudes/model/mensajeDeError.ts` | 1440 | `DURACION_MAXIMA_MIN` / `@Max(1440)` (ADR-11 §2) |
| `TOPE_BANDEJA` — `entities/solicitud/api/solicitudApi.ts` | 100 | tope fijo de `GET /solicitudes` (solo afecta la píldora "100+") |

Mismo criterio: el backend valida siempre; la copia solo evita el 400 genérico.

**Fase 2 — recordatorios (2026-10-04):** más copias, de `CrearPacienteDto`, `ActualizarPacienteDto`,
`GuardarConfiguracionRecordatoriosDto` / `ConfiguracionRecordatorio` y del entorno del backend
(ADR-13 §3, §5, §14, §18):

| Constante (front) | Valor | Espejo de (backend) |
|-------------------|-------|---------------------|
| `CORREO_MAX` — `features/crear-cita/model/crearCitaSchema.ts` y `features/gestionar-cita/model/useEditarContacto.ts` | 254 | `@MaxLength(254)` del correo del paciente |
| `LIMITES_CONFIGURACION` — `features/configurar-recordatorios/model/configuracionSchema.ts` | 30 / 10.080 min, máx. 3, teléfono 30, correo 254 | `ANTELACION_MINIMA_MIN`, `ANTELACION_MAXIMA_MIN`, `MAX_ANTELACIONES`, `LARGO_MAXIMO_TELEFONO_CONTACTO`, `LARGO_MAXIMO_CORREO_RESPUESTA` |
| `HORAS_SIN_ENVIO` — mismo archivo | 21:00–08:00 | `RECORDATORIO_SILENCIO_DESDE` / `HASTA` (solo se muestra; no valida nada) |
| `MARGEN_MINIMO_MS` — `features/gestionar-cita/model/useRecordatoriosCita.ts` | 30 min | `RECORDATORIO_MARGEN_MINIMO_MIN` (solo decide si una lista vacía merece reintentos) |

Las dos últimas son **variables de entorno** del backend, no constantes de código: si se cambian en
Railway, el front queda diciendo otra cosa hasta que se actualice a mano. Si eso empieza a pasar, que
`GET /recordatorios/configuracion` las devuelva.

## Por qué existe la copia

Sin ella, pasarse de un largo devolvía un `400` genérico y el paciente no sabía qué campo corregir.
Con ella, el input no deja escribir de más, el motivo muestra un contador y el error aparece en el
campo correcto antes de enviar.

## Por qué se aceptó

Es la misma situación que [DTF-05](DTF-05.md): no hay paquete compartido entre los dos repos y no
se justifica por tres números. **El backend valida siempre**; si divergieran, el servidor rechaza y
no se corrompe nada.

## Riesgo concreto

El DTO está marcado como **provisional** en el backend. Si se ajustan los campos:

- **si el backend baja un límite**, el front deja pasar valores que el servidor rechaza con el 400
  genérico — vuelve el problema original;
- **si lo sube**, el front corta al paciente antes de lo necesario.

Al tocar `crear-solicitud.dto.ts`, actualizar `LIMITES` en el mismo cambio.

## Cuándo revisar

Junto con DTF-05: si aparece un paquete compartido de dominio, los límites van ahí.
