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
