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

**Fase 3 — respuesta del paciente (2026-10-14):** una copia más, del portal del paciente
([responder-cita-paciente](../Features/responder-cita-paciente.md)):

| Constante (front) | Valor | Espejo de (backend) |
|-------------------|-------|---------------------|
| `LIMITE_TEXTO` — `features/responder-cita/model/formularios.ts` | 300 | `preferencia` (1..300) y `motivo` (≤ 300) de `POST /publico/cita/cancelar` y `/otra-hora` |

**Fase 7 — US-10, Mi perfil y soporte (2026-11-01):** seis copias más, de `usuario` y `soporte` del backend
([perfil-cuenta](../Features/perfil-cuenta.md)). Cada constante lleva en su comentario la del backend que copia:

| Constante (front) | Valor | Cómo se cuenta | Espejo de (backend) |
|-------------------|-------|----------------|---------------------|
| `NOMBRE_MAX` — `features/editar-perfil/model/perfilSchema.ts` | 120 | `.length` tras recortar | `LARGO_MAXIMO_NOMBRE` (`usuario/domain/usuario.entity.ts`), `@MaxLength` de `nombreCompleto` en `ActualizarPerfilDto` |
| `ESPECIALIDAD_MAX` — mismo archivo | 100 | `.length` tras recortar | `LARGO_MAXIMO_ESPECIALIDAD` (mismo archivo), `@MaxLength` de `especialidad` |
| `CONTRASENA_MIN_CARACTERES` — `features/cambiar-contrasena/model/contrasenaSchema.ts` | 8 | caracteres **reales** (`Array.from(texto).length`: un emoji es uno), sin recortar | `LARGO_MINIMO_CONTRASENA` (`usuario/domain/contrasena.ts`) |
| `CONTRASENA_MAX_BYTES` — mismo archivo | 72 | **bytes UTF-8** (`new TextEncoder().encode(texto).length`), sin recortar | `BYTES_MAXIMOS_CONTRASENA` (mismo archivo; bcrypt ignora lo que pasa de 72 bytes). El DTO no lo comprueba: el tope es del dominio |
| `MENSAJE_MAX` — `features/contactar-soporte/model/soporteSchema.ts` | 2000 | `.length` tras recortar los extremos | `LARGO_MAXIMO_MENSAJE_SOPORTE` (`soporte/domain/limites-soporte.ts`), `@MaxLength` de `CrearMensajeSoporteDto` |
| `CATEGORIAS` — mismo archivo | `problema`, `consulta`, `sugerencia`, `otro` | — | `enum CategoriaSoporte` (`soporte/domain/mensaje-soporte.entity.ts`). Una categoría nueva en el backend no aparece en el modal hasta copiarla aquí (y en `CategoriaSoporte` de `model/types.ts`) |

La contraseña es la única copia que **no cuenta como `.length`**: si el backend cambiara la forma de contar
(caracteres o bytes), el front dejaría pasar o cortaría contraseñas que el servidor trata distinto. El texto del
error del tope (*"…como máximo 72 bytes (72 letras sin tildes; menos si lleva tildes, ñ o emojis)"*) también está
copiado, para mostrarlo antes de enviar.

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

Al tocar `crear-solicitud.dto.ts`, actualizar `LIMITES` en el mismo cambio. Igual con las constantes de
`usuario` y `soporte` (Fase 7): las de la tabla de arriba.

## Cuándo revisar

Junto con DTF-05: si aparece un paquete compartido de dominio, los límites van ahí.
