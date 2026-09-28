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
